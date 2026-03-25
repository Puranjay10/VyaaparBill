from __future__ import annotations

from typing import Any, Dict, List

from app.db import invoices_collection


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

