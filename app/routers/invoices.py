from datetime import datetime
import os

from fastapi import APIRouter, UploadFile, File
import fitz  # PyMuPDF

from app.db import invoices_collection, inventory_collection, sales_collection
from app.services.invoice_logic import (
    detect_table_type,
    extract_table_section,
    extract_invoice_metadata,
    is_non_product_item,
    parse_items_from_table,
    update_inventory,
)


router = APIRouter()

UPLOAD_FOLDER = "uploads"


@router.get("/")
def home():
    return {"message": "Server is running ✅"}


@router.post("/upload")
async def upload_invoice(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    doc = fitz.open(file_path)

    full_text = ""
    tables = []

    for page in doc:
        page_text = page.get_text()
        full_text += page_text + "\n"

        # FIX: now returns MULTIPLE tables from same page
        table_text = extract_table_section(page_text)
        if table_text.strip():
            tables.append(table_text)

    doc.close()

    combined_table_text = "\n\n---TABLE BREAK---\n\n".join(tables)

    metadata = extract_invoice_metadata(full_text)

    # detect table type
    table_type = detect_table_type(combined_table_text)

    items = parse_items_from_table(combined_table_text, table_type)

    # EXTRA FIX:
    # If amazon parsing returns COD fee, remove it
    if table_type == "AMAZON_IGST":
        items = [it for it in items if not is_non_product_item(it.get("description"))]

    invoice_doc = {
        "filename": safe_filename,
        "text_length": len(full_text),
        "table_type": table_type,
        "table_count": len(tables),
        "full_text": full_text,
        "tables": tables,
        "combined_table_text": combined_table_text,
        "metadata": metadata,
        "items": items,
        "created_at": datetime.utcnow()
    }

    result = invoices_collection.insert_one(invoice_doc)

    update_inventory(metadata, items)

    return {
        "invoice_id": str(result.inserted_id),
        "filename": safe_filename,
        "metadata": metadata,
        "table_type": table_type,
        "table_count": len(tables),
        "items": items,
        "text_length": len(full_text),
        "combined_table_preview": combined_table_text[:1500],
        "text_preview": full_text[:4000]
    }


@router.get("/inventory")
def get_inventory():
    DEFAULT_LOW_STOCK_THRESHOLD = 5
    pipeline = [
        {"$sort": {"updated_at": -1}},
        {
            "$lookup": {
                "from": sales_collection.name,
                "let": {"product_desc": "$description"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {"$eq": ["$product_name", "$$product_desc"]},
                        }
                    },
                    {"$sort": {"sold_at": -1}},
                    {"$limit": 1},
                    {"$project": {"selling_price": 1}},
                ],
                "as": "_latestSale",
            }
        },
        {
            "$addFields": {
                "low_stock_threshold": {
                    "$ifNull": ["$low_stock_threshold", DEFAULT_LOW_STOCK_THRESHOLD],
                },
                "qty_in_stock_num": {
                    "$toDouble": {"$ifNull": ["$qty_in_stock", 0]},
                },
                "_last_purchase_price": {
                    "$ifNull": ["$last_unit_price", "$last_price"],
                },
                "latest_selling_price": {
                    "$arrayElemAt": ["$_latestSale.selling_price", 0]
                },
                "is_low_stock": {
                    "$lt": [
                        {"$toDouble": {"$ifNull": ["$qty_in_stock", 0]}},
                        {
                            "$ifNull": [
                                "$low_stock_threshold",
                                DEFAULT_LOW_STOCK_THRESHOLD,
                            ]
                        },
                    ]
                },
            }
        },
        {
            "$addFields": {
                "profit_per_unit": {
                    "$cond": [
                        {"$ne": ["$latest_selling_price", None]},
                        {
                            "$subtract": [
                                {"$toDouble": "$latest_selling_price"},
                                {"$toDouble": {"$ifNull": ["$_last_purchase_price", 0]}},
                            ]
                        },
                        None,
                    ]
                },
                "potential_profit": {
                    "$cond": [
                        {"$ne": ["$latest_selling_price", None]},
                        {
                            "$multiply": [
                                {
                                    "$subtract": [
                                        {"$toDouble": "$latest_selling_price"},
                                        {
                                            "$toDouble": {
                                                "$ifNull": ["$_last_purchase_price", 0]
                                            }
                                        },
                                    ]
                                },
                                "$qty_in_stock_num",
                            ]
                        },
                        None,
                    ]
                },
            }
        },
        {"$project": {"_latestSale": 0, "qty_in_stock_num": 0, "_last_purchase_price": 0}},
    ]

    items = list(inventory_collection.aggregate(pipeline))
    # Keep response backward compatible: do not include Mongo _id in the API output.
    for it in items:
        it.pop("_id", None)

    return {"count": len(items), "inventory": items}


@router.get("/invoices")
def get_invoices():
    invoices = list(invoices_collection.find({}).sort("created_at", -1))
    for inv in invoices:
        inv["_id"] = str(inv["_id"])
    return {"count": len(invoices), "invoices": invoices}


@router.delete("/reset")
def reset_all_data():
    deleted_invoices = invoices_collection.delete_many({})
    deleted_inventory = inventory_collection.delete_many({})

    return {
        "message": "All invoices and inventory cleared.",
        "deleted_invoices": deleted_invoices.deleted_count,
        "deleted_inventory_items": deleted_inventory.deleted_count,
    }

