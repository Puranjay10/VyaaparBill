import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { useToast } from "../context/ToastContext";
import { useTranslation } from "react-i18next";
import Card from "./Card";
import Button from "./Button";
import Spinner from "./Spinner";

const API_BASE = "http://127.0.0.1:8000";

export default function SellCard({ onSaleSuccess } = {}) {
  const addToast = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [selectedDesc, setSelectedDesc] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const selectedProduct = useMemo(() => {
    const desc = (selectedDesc || "").trim();
    return inventory.find((p) => (p.description || "").trim() === desc) || null;
  }, [inventory, selectedDesc]);

  const availableQty = Number(selectedProduct?.qty_in_stock ?? 0) || 0;

  async function fetchInventory() {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/inventory`);
      setInventory(res.data.inventory || []);
    } catch (err) {
      console.error(err);
      setLoadError("Failed to load inventory. Is the backend running?");
      addToast("Failed to load inventory. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const last = selectedProduct?.last_unit_price;
    if (selectedDesc && last !== undefined && last !== null && last !== "") {
      const n = Number(last);
      if (Number.isFinite(n)) {
        const margin = 0.05; // small margin
        const price = n * (1 + margin);
        setSellingPrice(price.toFixed(2));
      }
    }
  }, [selectedDesc, selectedProduct]);

  function resetForm() {
    setSelectedDesc("");
    setQuantity("");
    setSellingPrice("");
  }

  const canSubmit = useMemo(() => {
    if (!selectedDesc) return false;
    const q = Number(quantity);
    const sp = Number(sellingPrice);
    if (!Number.isFinite(q) || q <= 0) return false;
    if (!Number.isFinite(sp) || sp <= 0) return false;
    if (q > availableQty) return false;
    return true;
  }, [availableQty, quantity, selectedDesc, sellingPrice]);

  async function handleSell(e) {
    e.preventDefault();

    const q = Number(quantity);
    const sp = Number(sellingPrice);
    const product_name = selectedDesc;

    if (!canSubmit) {
      addToast("Please check product, quantity, and selling price.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/sell`,
        { product_name, quantity: q, selling_price: sp },
        { headers: { "Content-Type": "application/json" } }
      );

      addToast("Sale recorded successfully.", "success");
      await fetchInventory();
      if (onSaleSuccess) onSaleSuccess();
      resetForm();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      addToast(detail || "Sale failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title={t("sell_product")}>
      <form onSubmit={handleSell} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">{t("select_product")}</label>
          <select
            value={selectedDesc}
            onChange={(e) => setSelectedDesc(e.target.value)}
            disabled={loading || inventory.length === 0}
            className="w-full rounded-xl border border-border bg-surface-950 px-4 py-2.5 text-sm text-slate-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          >
            <option value="">{t("choose_product")}</option>
            {inventory
              .slice()
              .sort((a, b) => String(a.description || "").localeCompare(String(b.description || "")))
              .map((p, idx) => (
                <option key={`${p.product_key || p.description}-${idx}`} value={p.description || ""}>
                  {p.description}
                </option>
              ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="rounded-xl border border-border bg-surface-950/80 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">{t("available_stock")}</span>
              <span className="font-semibold text-slate-200">{availableQty}</span>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">{t("quantity")}</label>
            <input
              type="number"
              step="1"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!selectedDesc || loading}
              className="w-full rounded-xl border border-border bg-surface-950 px-4 py-2.5 text-sm text-slate-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              placeholder="e.g. 2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">{t("selling_price")}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              disabled={!selectedDesc || loading}
              className="w-full rounded-xl border border-border bg-surface-950 px-4 py-2.5 text-sm text-slate-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              placeholder="e.g. 99.50"
            />
          </div>
        </div>

        {loadError && (
          <p className="text-sm text-red-400" role="status">
            {loadError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={resetForm}
            disabled={submitting || loading || !selectedDesc}
          >
            {t("reset")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit || submitting}>
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
                {t("selling")}
              </>
            ) : (
              t("sell_product")
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

