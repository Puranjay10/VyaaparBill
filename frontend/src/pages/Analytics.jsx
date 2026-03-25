import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [monthly, setMonthly] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);

  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerError, setSellerError] = useState(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);

  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [loadingReorder, setLoadingReorder] = useState(false);
  const [reorderError, setReorderError] = useState(null);

  const [bestSuppliers, setBestSuppliers] = useState([]);
  const [loadingBestSuppliers, setLoadingBestSuppliers] = useState(false);
  const [bestSuppliersError, setBestSuppliersError] = useState(null);
  const [bestPriceSortDir, setBestPriceSortDir] = useState("asc");

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

  async function fetchReorderSuggestions() {
    try {
      setReorderError(null);
      setLoadingReorder(true);
      const res = await axios.get(`${API_BASE}/analytics/reorder-suggestions`);
      setReorderSuggestions(res.data || []);
    } catch (err) {
      console.error(err);
      setReorderError("Failed to load reorder suggestions.");
      addToast("Failed to load reorder suggestions. Is the backend running?", "error");
    } finally {
      setLoadingReorder(false);
    }
  }

  async function fetchBestSuppliers() {
    try {
      setBestSuppliersError(null);
      setLoadingBestSuppliers(true);
      const res = await axios.get(`${API_BASE}/analytics/best-suppliers`);
      setBestSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
      setBestSuppliersError("Failed to load best suppliers.");
      addToast("Failed to load best suppliers. Is the backend running?", "error");
    } finally {
      setLoadingBestSuppliers(false);
    }
  }

  async function refreshAll() {
    await Promise.all([
      fetchMonthly(),
      fetchSellerSummary(),
      fetchProductSummary(),
      fetchBestSuppliers(),
      fetchReorderSuggestions(),
    ]);
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

  const sortedBestSuppliers = useMemo(() => {
    const rows = [...(bestSuppliers || [])];
    const dir = bestPriceSortDir === "asc" ? 1 : -1;
    rows.sort(
      (a, b) =>
        (toNumberOrZero(a.best_price) - toNumberOrZero(b.best_price)) * dir
    );
    return rows;
  }, [bestSuppliers, bestPriceSortDir]);

  function toggleSellerSort(nextKey) {
    setSellerSort((prev) => {
      if (prev.key !== nextKey) return { key: nextKey, dir: "desc" };
      return { key: nextKey, dir: prev.dir === "desc" ? "asc" : "desc" };
    });
  }

  function toggleBestPriceSort() {
    setBestPriceSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  return (
    <div className="flex min-h-screen bg-surface-950 bg-gradient-to-br from-surface-950 via-surface-900/30 to-surface-950">
      <Sidebar currentView="analytics" onNavigate={() => navigate("/app")} />

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">{t("analytics_title")}</h1>
              <p className="mt-1 text-sm text-slate-400">{t("analytics_description")}</p>
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
                    {t("refreshing")}
                  </>
                ) : (
                  t("refresh")
                )}
              </Button>
            </div>
          </div>

          <Card
            title={t("monthly_purchases")}
            action={
              <Button variant="secondary" disabled={loadingMonthly} onClick={fetchMonthly}>
                {loadingMonthly ? <Spinner className="h-4 w-4" /> : t("refresh")}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingMonthly ? (
                <TableSkeleton rows={6} cols={3} />
              ) : monthlyError ? (
                <EmptyState title={t("couldnt_load_monthly_purchases")} description={monthlyError} />
              ) : monthly.length === 0 ? (
                <EmptyState
                  title={t("no_data_yet")}
                  description={t("upload_invoices_to_see_monthly_purchase_totals")}
                />
              ) : (
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">{t("month")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("total_purchase")}</th>
                      <th className="pb-3 font-medium">{t("invoice_count")}</th>
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
            title={t("seller_summary")}
            action={
              <Button variant="secondary" disabled={loadingSellers} onClick={fetchSellerSummary}>
                {loadingSellers ? <Spinner className="h-4 w-4" /> : t("refresh")}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingSellers ? (
                <TableSkeleton rows={6} cols={4} />
              ) : sellerError ? (
                <EmptyState title={t("couldnt_load_seller_summary")} description={sellerError} />
              ) : sortedSellers.length === 0 ? (
                <EmptyState
                  title={t("no_data_yet")}
                  description={t("upload_invoices_to_see_seller_wise_totals")}
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
                          {t("seller_gstin")}
                        </button>
                      </th>
                      <th className="pb-3 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("total_purchase")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          {t("total_purchase")}
                        </button>
                      </th>
                      <th className="pb-3 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("invoice_count")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          {t("invoice_count")}
                        </button>
                      </th>
                      <th className="pb-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleSellerSort("total_items")}
                          className="inline-flex items-center gap-1 hover:text-slate-300"
                        >
                          {t("total_items")}
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
            title={t("product_summary")}
            action={
              <Button variant="secondary" disabled={loadingProducts} onClick={fetchProductSummary}>
                {loadingProducts ? <Spinner className="h-4 w-4" /> : t("refresh")}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingProducts ? (
                <TableSkeleton rows={7} cols={5} />
              ) : productError ? (
                <EmptyState title={t("couldnt_load_product_summary")} description={productError} />
              ) : sortedProducts.length === 0 ? (
                <EmptyState
                  title={t("no_data_yet")}
                  description={t("upload_invoices_to_see_product_level_totals")}
                />
              ) : (
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">{t("description")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("total_qty")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("total_purchase")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("avg_unit_price")}</th>
                      <th className="pb-3 font-medium">{t("invoice_count")}</th>
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
              {t("sorted_by_total_purchase_desc")}
            </p>
          </Card>

          <Card
            title={t("best_suppliers")}
            action={
              <Button
                variant="secondary"
                disabled={loadingBestSuppliers}
                onClick={fetchBestSuppliers}
              >
                {loadingBestSuppliers ? <Spinner className="h-4 w-4" /> : t("refresh")}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingBestSuppliers ? (
                <TableSkeleton rows={7} cols={4} />
              ) : bestSuppliersError ? (
                <EmptyState title={t("couldnt_load_best_suppliers")} description={bestSuppliersError} />
              ) : sortedBestSuppliers.length === 0 ? (
                <EmptyState
                  title={t("no_sales_data_yet")}
                  description={t("record_sales_to_see_best_supplier_intelligence")}
                />
              ) : (
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">{t("product_name")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("best_supplier_gstin")}</th>
                      <th className="pb-3 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={toggleBestPriceSort}
                          className="inline-flex items-center gap-2 hover:text-slate-300"
                        >
                          {t("best_price")}
                          <span className="text-xs text-slate-600">
                            {bestPriceSortDir === "asc" ? "↑" : "↓"}
                          </span>
                        </button>
                      </th>
                      <th className="pb-3 font-medium">{t("all_suppliers")}</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {sortedBestSuppliers.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-3 pr-3">{row.product_name ?? "—"}</td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-500">
                                {row.best_supplier_gstin ?? "—"}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                                {t("best")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">{formatMoney(row.best_price)}</td>
                        <td className="py-3">
                          <div className="max-w-[520px]">
                            <ul className="space-y-1">
                              {(row.all_suppliers || []).map((s, j) => (
                                <li key={j} className="text-xs text-slate-400">
                                  <span className="font-mono">{s.supplier_gstin ?? "—"}</span>
                                  <span className="text-slate-600"> · </span>
                                  <span className={toNumberOrZero(s.avg_price) < 0 ? "text-red-400" : "text-slate-300"}>
                                    {s.avg_price === null || s.avg_price === undefined
                                      ? "—"
                                      : formatMoney(s.avg_price)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card
            title={t("reorder_suggestions")}
            action={
              <Button variant="secondary" disabled={loadingReorder} onClick={fetchReorderSuggestions}>
                {loadingReorder ? <Spinner className="h-4 w-4" /> : t("refresh")}
              </Button>
            }
          >
            <div className="overflow-x-auto scrollbar-thin">
              {loadingReorder ? (
                <TableSkeleton rows={6} cols={5} />
              ) : reorderError ? (
                <EmptyState title={t("couldnt_load_reorder_suggestions")} description={reorderError} />
              ) : reorderSuggestions.length === 0 ? (
                <EmptyState title={t("all_items_sufficiently_stocked")} />
              ) : (
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-slate-500">
                      <th className="pb-3 pr-3 font-medium">{t("product_name")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("current_stock")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("suggested_order_quantity")}</th>
                      <th className="pb-3 pr-3 font-medium">{t("best_supplier")}</th>
                      <th className="pb-3 font-medium">{t("estimated_price")}</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {reorderSuggestions.map((row, idx) => {
                      const currentStock = Number(row.current_stock ?? 0) || 0;
                      const isLow = currentStock < 5;
                      const rowClass = isLow
                        ? "border-b border-border/50 bg-red-500/10"
                        : "border-b border-border/50";
                      const estimatedPrice =
                        row.estimated_price === null || row.estimated_price === undefined
                          ? t("no_data")
                          : formatMoney(row.estimated_price);
                      const bestSupplier =
                        row.best_supplier_gstin === null || row.best_supplier_gstin === undefined
                          ? t("no_data")
                          : row.best_supplier_gstin;

                      return (
                        <tr key={idx} className={rowClass}>
                          <td className="py-3 pr-3">{row.product_name ?? "—"}</td>
                          <td className="py-3 pr-3">{currentStock}</td>
                          <td className="py-3 pr-3 font-semibold">
                            {row.suggested_order_quantity ?? 0}
                          </td>
                          <td className="py-3 pr-3">{bestSupplier}</td>
                          <td className="py-3">{estimatedPrice}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
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

