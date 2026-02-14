import Button from "./Button";
import Card from "./Card";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import TableSkeleton from "./TableSkeleton";

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

export default function InventoryCard({
  inventory,
  loading,
  search,
  setSearch,
  onRefresh,
}) {
  const filtered = search.trim()
    ? inventory.filter((item) =>
        (item.description || "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : inventory;

  const totalUnits = inventory.reduce((sum, i) => sum + (Number(i.qty_in_stock) || 0), 0);

  return (
    <Card
      title="Inventory"
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled={loading} onClick={onRefresh}>
            {loading ? <Spinner className="h-4 w-4" /> : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            disabled={loading || inventory.length === 0}
            onClick={() => downloadInventoryCsv(inventory)}
          >
            Download CSV
          </Button>
        </div>
      }
    >
      {!loading && inventory.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4 rounded-xl bg-surface-950/80 px-4 py-3 text-sm">
          <span className="text-slate-400">
            <strong className="font-semibold text-slate-200">{inventory.length}</strong> products
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            <strong className="font-semibold text-slate-200">{totalUnits.toLocaleString()}</strong> units in stock
          </span>
        </div>
      )}

      <input
        type="search"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl border border-border bg-surface-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />

      <div className="overflow-x-auto scrollbar-thin">
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            title={inventory.length === 0 ? "No inventory items" : "No matches"}
            description={
              inventory.length === 0
                ? "Upload an invoice to populate inventory."
                : "Try a different search."
            }
          />
        ) : (
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-slate-500">
                <th className="pb-3 pr-3 font-medium">Product</th>
                <th className="pb-3 pr-3 font-medium">Qty in stock</th>
                <th className="pb-3 pr-3 font-medium">Last unit price</th>
                <th className="pb-3 font-medium">Seller GSTIN</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {filtered.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/50 transition-colors hover:bg-surface-800/50"
                >
                  <td className="py-3 pr-3">{item.description}</td>
                  <td className="py-3 pr-3">{item.qty_in_stock ?? 0}</td>
                  <td className="py-3 pr-3">₹{item.last_unit_price ?? "—"}</td>
                  <td className="py-3 font-mono text-xs text-slate-500">
                    {item.seller_gstin ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
