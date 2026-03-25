import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { useToast } from "../context/ToastContext";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import TableSkeleton from "../components/TableSkeleton";
import EmptyState from "../components/EmptyState";

const API_BASE = "http://127.0.0.1:8000";

function formatMonth(year, month) {
  if (!year || !month) return "—";
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toNumberOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Analytics() {
  const addToast = useToast();
  const navigate = useNavigate();

  const [monthly, setMonthly] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);

  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerError, setSellerError] = useState(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);

  const [sellerSort, setSellerSort] = useState({ key: "total_purchase", dir: "desc" });

  async function fetchMonthly() {
    try {
      setMonthlyError(null);
      setLoadingMonthly(true);
      const res = await axios.get(`${API_BASE}/analytics/monthly-purchases`);
      setMonthly(res.data.summary || []);
    } catch (err) {
      console.error(err);
      setMonthlyError("Failed to load monthly purchases.");
      addToast("Failed to load monthly purchases. Is the backend running?", "error");
    } finally {
      setLoadingMonthly(false);
    }
  }

  async function fetchSellerSummary() {
    try {
      setSellerError(null);
      setLoadingSellers(true);
      const res = await axios.get(`${API_BASE}/analytics/seller-summary`);
      setSellers(res.data.summary || []);
    } catch (err) {
      console.error(err);
      setSellerError("Failed to load seller summary.");
      addToast("Failed to load seller summary. Is the backend running?", "error");
    } finally {
      setLoadingSellers(false);
    }
  }

  async function fetchProductSummary() {
    try {
      setProductError(null);
      setLoadingProducts(true);
      const res = await axios.get(`${API_BASE}/analytics/product-summary`);
      setProducts(res.data.summary || []);
    } catch (err) {
      console.error(err);
      setProductError("Failed to load product summary.");
      addToast("Failed to load product summary. Is the backend running?", "error");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function refreshAll() {
    await Promise.all([fetchMonthly(), fetchSellerSummary(), fetchProductSummary()]);
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedSellers = useMemo(() => {
    const rows = [...(sellers || [])];
    const { key, dir } = sellerSort;
    const mult = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (key === "seller_gstin") {
        const av = String(a.seller_gstin || "");
        const bv = String(b.seller_gstin || "");
        return av.localeCompare(bv) * mult;
      }
      return (toNumberOrZero(a[key]) - toNumberOrZero(b[key])) * mult;
    });
    return rows;
  }, [sellers, sellerSort]);

  const sortedProducts = useMemo(() => {
    const rows = [...(products || [])];
    rows.sort((a, b) => toNumberOrZero(b.total_purchase) - toNumberOrZero(a.total_purchase));
    return rows;
  }, [products]);

  function toggleSellerSort(nextKey) {
    setSellerSort((prev) => {
      if (prev.key !== nextKey) return { key: nextKey, dir: "desc" };
      return { key: nextKey, dir: prev.dir === "desc" ? "asc" : "desc" };
    });
  }

  return (
    <div className="flex min-h-screen bg-surface-950 bg-gradient-to-br from-surface-950 via-surface-900/30 to-surface-950">
      <Sidebar currentView="analytics" onNavigate={() => navigate("/app")} />

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Analytics</h1>
              <p className="mt-1 text-sm text-slate-400">Monthly purchases, seller totals, and product breakdown.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={refreshAll}
                disabled={loadingMonthly || loadingSellers || loadingProducts}
              >
                {(loadingMonthly || loadingSellers || loadingProducts) ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Refreshing…
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>

          <Card
            title="Monthly purchases"
            action={
              <Button variant="secondary" disabled={loadingMonthly} onClick={fetchMonthly}>
                {loadingMonthly ? <Spinner className="h-4 w-4" /> : "Refresh"}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingMonthly ? (
                <TableSkeleton rows={6} cols={3} />
              ) : monthlyError ? (
                <EmptyState title="Couldn’t load monthly purchases" description={monthlyError} />
              ) : monthly.length === 0 ? (
                <EmptyState
                  title="No data yet"
                  description="Upload invoices to see monthly purchase totals."
                />
              ) : (
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">Month</th>
                      <th className="pb-3 pr-3 font-medium">Total purchase</th>
                      <th className="pb-3 font-medium">Invoice count</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {monthly.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-3 pr-3">{formatMonth(row.year, row.month)}</td>
                        <td className="py-3 pr-3">{formatMoney(row.total_purchase)}</td>
                        <td className="py-3">{row.invoice_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card
            title="Seller summary"
            action={
              <Button variant="secondary" disabled={loadingSellers} onClick={fetchSellerSummary}>
                {loadingSellers ? <Spinner className="h-4 w-4" /> : "Refresh"}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingSellers ? (
                <TableSkeleton rows={6} cols={4} />
              ) : sellerError ? (
                <EmptyState title="Couldn’t load seller summary" description={sellerError} />
              ) : sortedSellers.length === 0 ? (
                <EmptyState
                  title="No data yet"
                  description="Upload invoices to see seller-wise totals."
                />
              ) : (
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("seller_gstin")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          Seller GSTIN
                        </button>
                      </th>
                      <th className="pb-3 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("total_purchase")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          Total purchase
                        </button>
                      </th>
                      <th className="pb-3 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("invoice_count")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          Invoice count
                        </button>
                      </th>
                      <th className="pb-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("total_items")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          Total items
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {sortedSellers.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-3 pr-3 font-mono text-xs text-slate-500">
                          {row.seller_gstin ?? "—"}
                        </td>
                        <td className="py-3 pr-3">{formatMoney(row.total_purchase)}</td>
                        <td className="py-3 pr-3">{row.invoice_count ?? 0}</td>
                        <td className="py-3">{row.total_items ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card
            title="Product summary"
            action={
              <Button variant="secondary" disabled={loadingProducts} onClick={fetchProductSummary}>
                {loadingProducts ? <Spinner className="h-4 w-4" /> : "Refresh"}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingProducts ? (
                <TableSkeleton rows={7} cols={5} />
              ) : productError ? (
                <EmptyState title="Couldn’t load product summary" description={productError} />
              ) : sortedProducts.length === 0 ? (
                <EmptyState
                  title="No data yet"
                  description="Upload invoices to see product-level totals."
                />
              ) : (
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">Description</th>
                      <th className="pb-3 pr-3 font-medium">Total qty</th>
                      <th className="pb-3 pr-3 font-medium">Total purchase</th>
                      <th className="pb-3 pr-3 font-medium">Avg unit price</th>
                      <th className="pb-3 font-medium">Invoice count</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {sortedProducts.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-3 pr-3">{row.description ?? "—"}</td>
                        <td className="py-3 pr-3">
                          {toNumberOrZero(row.total_quantity).toLocaleString()}
                        </td>
                        <td className="py-3 pr-3">{formatMoney(row.total_purchase)}</td>
                        <td className="py-3 pr-3">{formatMoney(row.avg_unit_price)}</td>
                        <td className="py-3">{row.invoice_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Sorted by total purchase (descending).
            </p>
          </Card>

          <footer className="mt-12 text-center text-xs text-slate-600">
            <Link to="/" className="hover:text-slate-500">Home</Link>
            <span className="mx-2">·</span>
            <Link to="/app" className="hover:text-slate-500">Dashboard</Link>
          </footer>
        </div>
      </main>
    </div>
  );
}

