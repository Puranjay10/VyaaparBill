import Button from "./Button";
import Card from "./Card";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import TableSkeleton from "./TableSkeleton";
import { useTranslation } from "react-i18next";

function downloadInventoryCsv(inventory) {
  if (!inventory || inventory.length === 0) {
    return;
  }

  const headers = [
    "Product",
    "Qty in stock",
    "Last unit price",
    "Seller GSTIN",
    "Last invoice number",
    "Last invoice date",
  ];

  const rows = inventory.map((item) => [
    (item.description || "").replace(/"/g, '""'),
    item.qty_in_stock ?? 0,
    item.last_unit_price ?? "",
    item.seller_gstin ?? "",
    item.last_invoice_number ?? "",
    item.last_invoice_date ?? "",
  ]);

  const csvLines = [
    headers.join(","),
    ...rows.map((cols) =>
      cols
        .map((col) =>
          typeof col === "string" ? `"${col}"` : col
        )
        .join(",")
    ),
  ];

  const csvContent = csvLines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `inventory-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatRupee(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toFixed(2)}`;
}

function profitTextClass(value) {
  if (value === null || value === undefined) return "text-slate-300";
  const n = Number(value);
  if (!Number.isFinite(n)) return "text-slate-300";
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-slate-300";
}

export default function InventoryCard({
  inventory,
  loading,
  search,
  setSearch,
  onRefresh,
}) {
  const { t } = useTranslation();
  const LOW_STOCK_THRESHOLD = 5;
  const filtered = search.trim()
    ? inventory.filter((item) =>
        (item.description || "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : inventory;

  const totalUnits = inventory.reduce((sum, i) => sum + (Number(i.qty_in_stock) || 0), 0);

  return (
    <Card
      title={t("inventory")}
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled={loading} onClick={onRefresh}>
            {loading ? <Spinner className="h-4 w-4" /> : t("refresh")}
          </Button>
          <Button
            variant="ghost"
            disabled={loading || inventory.length === 0}
            onClick={() => downloadInventoryCsv(inventory)}
          >
            {t("download_csv")}
          </Button>
        </div>
      }
    >
      {!loading && inventory.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4 rounded-xl bg-surface-950/80 px-4 py-3 text-sm">
          <span className="text-slate-400">
            <strong className="font-semibold text-slate-200">{inventory.length}</strong> {t("products")}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            <strong className="font-semibold text-slate-200">{totalUnits.toLocaleString()}</strong> {t("units_in_stock")}
          </span>
        </div>
      )}

      <input
        type="search"
        placeholder={t("search_products_placeholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl border border-border bg-surface-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />

      <div className="overflow-x-auto scrollbar-thin">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            title={inventory.length === 0 ? t("no_inventory_items") : t("no_matches")}
            description={
              inventory.length === 0 ? t("upload_an_invoice_to_populate_inventory") : t("try_different_search")
            }
          />
        ) : (
          <>
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-slate-500">
                  <th className="pb-3 pr-3 font-medium">{t("product")}</th>
                  <th className="pb-3 pr-3 font-medium">{t("current_stock")}</th>
                  <th className="pb-3 pr-3 font-medium">{t("last_unit_price")}</th>
                  <th className="pb-3 pr-3 font-medium">{t("selling_price")}</th>
                  <th className="pb-3 pr-3 font-medium">{`${t("profit")} / unit`}</th>
                  <th className="pb-3 pr-3 font-medium">{`${t("profit")} (total)`}</th>
                  <th className="pb-3 font-medium">{t("seller_gstin")}</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {filtered.map((item, idx) => (
                  (() => {
                    const qty = Number(item?.qty_in_stock ?? 0) || 0;
                    const isLow =
                      typeof item?.is_low_stock === "boolean"
                        ? item.is_low_stock
                        : qty < LOW_STOCK_THRESHOLD;
                    const rowClass = isLow
                      ? "border-b border-border/50 bg-red-500/10 transition-colors hover:bg-red-500/15"
                      : "border-b border-border/50 transition-colors hover:bg-surface-800/50";

                    return (
                      <tr key={idx} className={rowClass}>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <span>{item.description}</span>
                            {isLow && (
                              <span
                                className="inline-flex items-center rounded-full border border-red-500/25 bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-200"
                                title={t("low_stock")}
                                aria-label={t("low_stock")}
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          {isLow ? t("only_x_left", { qty }) : item.qty_in_stock ?? 0}
                        </td>
                        <td className="py-3 pr-3">{formatRupee(item.last_unit_price)}</td>
                        <td className="py-3 pr-3">{formatRupee(item.latest_selling_price)}</td>
                        <td className={`py-3 pr-3 ${profitTextClass(item.profit_per_unit)}`}>
                          {item.profit_per_unit === null || item.profit_per_unit === undefined
                            ? "—"
                            : formatRupee(item.profit_per_unit)}
                        </td>
                        <td className="py-3 pr-3">
                          {item.potential_profit === null || item.potential_profit === undefined
                            ? "—"
                            : formatRupee(item.potential_profit)}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-500">
                          {item.seller_gstin ?? "—"}
                        </td>
                      </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </Card>
  );
}
