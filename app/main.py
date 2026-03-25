from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analytics import router as analytics_router
from app.routers.invoices import router as invoices_router
from app.routers.sales import router as sales_router

app = FastAPI(title="VyaaparBill - GST Invoice Parser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoices_router)
app.include_router(analytics_router)
app.include_router(sales_router)
