from fastapi import APIRouter

from app.services.analytics_service import get_monthly_purchase_summary
from app.services.analytics_service import get_seller_purchase_summary
from app.services.analytics_service import get_product_purchase_summary
from app.services.analytics_service import get_best_suppliers
from app.services.analytics_service import get_reorder_suggestions

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


@router.get("/best-suppliers")
def best_suppliers():
    # Returns an array directly (not wrapped in {count, summary}).
    return get_best_suppliers()


@router.get("/reorder-suggestions")
def reorder_suggestions():
    # Returns an array directly.
    return get_reorder_suggestions()