from __future__ import annotations

from typing import Any, Dict, List

from app.db import invoices_collection, inventory_collection


def get_monthly_purchase_summary() -> List[Dict[str, Any]]:
    """
    Returns monthly purchase summary grouped by year and month.

    Notes:
    - Uses MongoDB aggregation (pymongo) over `invoices_collection`.
    - Groups by parsed invoice date when available, otherwise falls back to `created_at`.
    - Sums totals from each invoice's `items[].total_amount`.
    """

    pipeline = [
        {
            "$addFields": {
                "_invoiceDateParsed": {
                    "$ifNull": [
                        {
                            "$dateFromString": {
                                "dateString": "$metadata.invoice_date",
                                "format": "%d-%m-%Y",
                                "onError": None,
                                "onNull": None,
                            }
                        },
                        {
                            "$ifNull": [
                                {
                                    "$dateFromString": {
                                        "dateString": "$metadata.invoice_date",
                                        "format": "%d.%m.%Y",
                                        "onError": None,
                                        "onNull": None,
                                    }
                                },
                                {
                                    "$ifNull": [
                                        {
                                            "$dateFromString": {
                                                "dateString": "$metadata.invoice_date",
                                                "format": "%d-%b-%y",
                                                "onError": None,
                                                "onNull": None,
                                            }
                                        },
                                        "$created_at",
                                    ]
                                },
                            ]
                        },
                    ]
                }
            }
        },
        {
            "$addFields": {
                "_items": {"$ifNull": ["$items", []]},
            }
        },
        {
            "$addFields": {
                "_invoiceTotal": {
                    "$sum": {
                        "$map": {
                            "input": "$_items",
                            "as": "it",
                            "in": {
                                "$convert": {
                                    "input": "$$it.total_amount",
                                    "to": "double",
                                    "onError": 0,
                                    "onNull": 0,
                                }
                            },
                        }
                    }
                },
                "_itemCount": {"$size": "$_items"},
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$_invoiceDateParsed"},
                    "month": {"$month": "$_invoiceDateParsed"},
                },
                "invoice_count": {"$sum": 1},
                "item_count": {"$sum": "$_itemCount"},
                "total_purchase": {"$sum": "$_invoiceTotal"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "year": "$_id.year",
                "month": "$_id.month",
                "invoice_count": 1,
                "item_count": 1,
                "total_purchase": {"$round": ["$total_purchase", 2]},
            }
        },
        {"$sort": {"year": 1, "month": 1}},
    ]

    return list(invoices_collection.aggregate(pipeline))


def get_seller_purchase_summary() -> List[Dict[str, Any]]:
    """
    Groups invoices by metadata.seller_gstin and returns purchase totals.

    Output fields:
    - seller_gstin
    - invoice_count
    - total_items (sum of items length)
    - total_purchase (sum of items.total_amount)
    """

    pipeline = [
        {
            "$addFields": {
                "_seller_gstin": {"$ifNull": ["$metadata.seller_gstin", "UNKNOWN"]},
                "_items": {"$ifNull": ["$items", []]},
            }
        },
        {
            "$addFields": {
                "_itemCount": {"$size": "$_items"},
                "_invoiceTotal": {
                    "$sum": {
                        "$map": {
                            "input": "$_items",
                            "as": "it",
                            "in": {
                                "$convert": {
                                    "input": "$$it.total_amount",
                                    "to": "double",
                                    "onError": 0,
                                    "onNull": 0,
                                }
                            },
                        }
                    }
                },
            }
        },
        {
            "$group": {
                "_id": "$_seller_gstin",
                "invoice_count": {"$sum": 1},
                "total_items": {"$sum": "$_itemCount"},
                "total_purchase": {"$sum": "$_invoiceTotal"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "seller_gstin": "$_id",
                "invoice_count": 1,
                "total_items": 1,
                "total_purchase": {"$round": ["$total_purchase", 2]},
            }
        },
        {"$sort": {"total_purchase": -1}},
    ]

    return list(invoices_collection.aggregate(pipeline))


def get_product_purchase_summary() -> List[Dict[str, Any]]:
    """
    Unwinds invoice items and groups by items.description.

    Computes:
    - total_quantity: sum of items.qty
    - total_purchase: sum of items.total_amount
    - avg_unit_price: average of items.unit_price (null-safe)
    - invoice_count: distinct invoice _id count
    """

    pipeline = [
        {"$addFields": {"_items": {"$ifNull": ["$items", []]}}},
        {"$unwind": "$_items"},
        {
            "$addFields": {
                "_desc": {"$ifNull": ["$_items.description", "UNKNOWN"]},
                "_qty": {
                    "$convert": {
                        "input": "$_items.qty",
                        "to": "double",
                        "onError": 0,
                        "onNull": 0,
                    }
                },
                "_total": {
                    "$convert": {
                        "input": "$_items.total_amount",
                        "to": "double",
                        "onError": 0,
                        "onNull": 0,
                    }
                },
                "_unit_price": {
                    "$convert": {
                        "input": "$_items.unit_price",
                        "to": "double",
                        "onError": None,
                        "onNull": None,
                    }
                },
            }
        },
        {
            "$group": {
                "_id": "$_desc",
                "total_quantity": {"$sum": "$_qty"},
                "total_purchase": {"$sum": "$_total"},
                "avg_unit_price": {"$avg": "$_unit_price"},
                "invoice_ids": {"$addToSet": "$_id"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "description": "$_id",
                "total_quantity": 1,
                "total_purchase": {"$round": ["$total_purchase", 2]},
                "avg_unit_price": {"$round": [{"$ifNull": ["$avg_unit_price", 0]}, 2]},
                "invoice_count": {"$size": "$invoice_ids"},
            }
        },
        {"$sort": {"total_purchase": -1}},
    ]

    return list(invoices_collection.aggregate(pipeline))


def get_best_suppliers() -> List[Dict[str, Any]]:
    """
    Returns best supplier per product using average item price.

    Aggregation strategy (MongoDB-only, no Python loops):
    1. Unwind invoice `items`
    2. Compute a per-item price:
       - prefer items.unit_price
       - fallback to total_amount / qty when unit_price is missing
    3. Group by (product, supplier) to compute avg_price
    4. Sort avg_price ascending and pick the lowest avg_price supplier per product
    5. Return all suppliers + best supplier per product
    """

    pipeline = [
        {"$addFields": {"_items": {"$ifNull": ["$items", []]}}},
        {"$unwind": "$_items"},
        {
            "$addFields": {
                "_product_name": {"$ifNull": ["$_items.description", "UNKNOWN"]},
                "_supplier_gstin": {"$ifNull": ["$metadata.seller_gstin", None]},
                "_qty_num": {
                    "$convert": {
                        "input": "$_items.qty",
                        "to": "double",
                        "onError": 0,
                        "onNull": 0,
                    }
                },
                "_unit_price_num": {
                    "$convert": {
                        "input": "$_items.unit_price",
                        "to": "double",
                        "onError": None,
                        "onNull": None,
                    }
                },
                "_total_amount_num": {
                    "$convert": {
                        "input": "$_items.total_amount",
                        "to": "double",
                        "onError": None,
                        "onNull": None,
                    }
                },
            }
        },
        {
            "$addFields": {
                "_item_price": {
                    "$cond": [
                        {"$ne": ["$_unit_price_num", None]},
                        "$_unit_price_num",
                        {
                            "$cond": [
                                {"$gt": ["$_qty_num", 0]},
                                {"$divide": ["$_total_amount_num", "$_qty_num"]},
                                None,
                            ]
                        },
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": {"product_name": "$_product_name", "supplier_gstin": "$_supplier_gstin"},
                "avg_price": {"$avg": "$_item_price"},
            }
        },
        {"$sort": {"_id.product_name": 1, "avg_price": 1}},
        {
            "$group": {
                "_id": "$_id.product_name",
                "best_supplier_gstin": {"$first": "$_id.supplier_gstin"},
                "best_price": {"$first": "$avg_price"},
                "all_suppliers": {
                    "$push": {
                        "supplier_gstin": "$_id.supplier_gstin",
                        "avg_price": "$avg_price",
                    }
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "product_name": "$_id",
                "best_supplier_gstin": 1,
                "best_price": 1,
                "all_suppliers": 1,
            }
        },
    ]

    return list(invoices_collection.aggregate(pipeline))


def get_reorder_suggestions() -> List[Dict[str, Any]]:
    """
    Returns reorder suggestions for low-stock inventory items.

    For each inventory item with qty_in_stock < 5:
    - current_stock = qty_in_stock
    - suggested_order_quantity = (5 * 2) - qty_in_stock
    - best supplier = supplier intelligence (lowest avg price) computed from invoices
      matching `inventory.description` == `items.description`
    - estimated_price = avg price of best supplier

    If no supplier data exists for that product, supplier fields are returned as null.
    """

    pipeline = [
        {
            "$addFields": {
                "_product_name": "$description",
                "_current_stock": {
                    "$toDouble": {"$ifNull": ["$qty_in_stock", 0]},
                },
            }
        },
        {
            "$match": {
                "$expr": {"$lt": ["$_current_stock", 5]},
            }
        },
        {
            "$addFields": {
                "suggested_order_quantity": {"$subtract": [10, "$_current_stock"]},
            }
        },
        {
            "$lookup": {
                "from": invoices_collection.name,
                "let": {"product_desc": "$_product_name"},
                "pipeline": [
                    {"$addFields": {"_items": {"$ifNull": ["$items", []]}}},
                    {"$unwind": "$_items"},
                    {
                        "$match": {
                            "$expr": {"$eq": ["$_items.description", "$$product_desc"]},
                        }
                    },
                    {
                        "$addFields": {
                            "_qty_num": {
                                "$convert": {
                                    "input": "$_items.qty",
                                    "to": "double",
                                    "onError": 0,
                                    "onNull": 0,
                                }
                            },
                            "_unit_price_num": {
                                "$convert": {
                                    "input": "$_items.unit_price",
                                    "to": "double",
                                    "onError": None,
                                    "onNull": None,
                                }
                            },
                            "_total_amount_num": {
                                "$convert": {
                                    "input": "$_items.total_amount",
                                    "to": "double",
                                    "onError": None,
                                    "onNull": None,
                                }
                            },
                        }
                    },
                    {
                        "$addFields": {
                            "_item_price": {
                                "$cond": [
                                    {"$ne": ["$_unit_price_num", None]},
                                    "$_unit_price_num",
                                    {
                                        "$cond": [
                                            {"$gt": ["$_qty_num", 0]},
                                            {"$divide": ["$_total_amount_num", "$_qty_num"]},
                                            None,
                                        ]
                                    },
                                ]
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "product_name": "$_items.description",
                                "supplier_gstin": "$metadata.seller_gstin",
                            },
                            "avg_price": {"$avg": "$_item_price"},
                        }
                    },
                    {"$sort": {"avg_price": 1}},
                    {"$limit": 1},
                    {
                        "$project": {
                            "_id": 0,
                            "supplier_gstin": "$_id.supplier_gstin",
                            "estimated_price": {"$round": ["$avg_price", 2]},
                        }
                    },
                ],
                "as": "_bestSupplier",
            }
        },
        {
            "$addFields": {
                "best_supplier_gstin": {
                    "$arrayElemAt": ["$_bestSupplier.supplier_gstin", 0]
                },
                "estimated_price": {
                    "$arrayElemAt": ["$_bestSupplier.estimated_price", 0]
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "product_name": "$_product_name",
                "current_stock": "$_current_stock",
                "suggested_order_quantity": 1,
                "best_supplier_gstin": 1,
                "estimated_price": 1,
            }
        },
        {"$sort": {"current_stock": 1}},
    ]

    return list(inventory_collection.aggregate(pipeline))

