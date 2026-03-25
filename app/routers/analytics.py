from fastapi import APIRouter

from app.services.analytics_service import get_monthly_purchase_summary
from app.services.analytics_service import get_seller_purchase_summary
from app.services.analytics_service import get_product_purchase_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/monthly-purchases")
def monthly_purchases():
    summary = get_monthly_purchase_summary()
    return {"count": len(summary), "summary": summary}

@router.get("/seller-summary")
def seller_summary():
    summary = get_seller_purchase_summary()
    return {"count": len(summary), "summary": summary}


@router.get("/supplier-summary")
def supplier_summary():
    summary = get_seller_purchase_summary()
    return {"count": len(summary), "summary": summary}

@router.get("/product-summary")
def product_summary():
    summary = get_product_purchase_summary()
    return {"count": len(summary), "summary": summary}