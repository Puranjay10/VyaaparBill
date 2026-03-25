from datetime import datetime
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import inventory_collection, sales_collection


router = APIRouter(prefix="", tags=["sales"])


class SellRequest(BaseModel):
    product_name: str
    quantity: float
    selling_price: float


def _find_inventory_by_description(product_name: str) -> Optional[dict]:
    """
    Case-insensitive exact match on `inventory_collection.description`.

    Inventory descriptions originate from parsed invoice text, so users may vary case.
    """
    name = (product_name or "").strip()
    if not name:
        return None

    return inventory_collection.find_one(
        {"description": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    )


@router.post("/sell")
def sell_product(body: SellRequest):
    product_name = body.product_name.strip()
    quantity = body.quantity
    selling_price = body.selling_price

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    if selling_price <= 0:
        raise HTTPException(status_code=400, detail="Selling price must be greater than 0")

    inventory_item = _find_inventory_by_description(product_name)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Product not found in inventory")

    available_qty = float(inventory_item.get("qty_in_stock", 0) or 0)
    if quantity > available_qty:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {available_qty}",
        )

    total_amount = quantity * selling_price
    sold_at = datetime.utcnow()

    # Reduce stock + update timestamp.
    inventory_collection.update_one(
        {"_id": inventory_item["_id"]},
        {
            "$inc": {"qty_in_stock": -quantity},
            "$set": {"updated_at": sold_at},
        },
    )

    sale_doc = {
        "product_name": product_name,
        "quantity": quantity,
        "selling_price": selling_price,
        "total_amount": total_amount,
        "sold_at": sold_at,
    }
    result = sales_collection.insert_one(sale_doc)

    updated_inventory = inventory_collection.find_one({"_id": inventory_item["_id"]}, {"_id": 0})

    return {
        "message": "Sale recorded and inventory updated.",
        "sale_id": str(result.inserted_id),
        "inventory": updated_inventory,
    }


@router.get("/sales")
def list_sales():
    sales = list(sales_collection.find({}).sort("sold_at", -1))
    for s in sales:
        s["_id"] = str(s["_id"])
    return {"count": len(sales), "sales": sales}

