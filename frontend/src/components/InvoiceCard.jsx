import Button from "./Button";
import Card from "./Card";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import TableSkeleton from "./TableSkeleton";
import { useTranslation } from "react-i18next";

export default function InvoiceCard({
  invoices,
  loading,
  selectedInvoice,
  setSelectedInvoice,
  onRefresh,
}) {
  const { t } = useTranslation();
  return (
    <Card
      title={t("uploaded_invoices")}
      action={
        <Button variant="secondary" disabled={loading} onClick={onRefresh}>
          {loading ? <Spinner className="h-4 w-4" /> : t("refresh")}
        </Button>
      }
    >
      <div className="overflow-x-auto scrollbar-thin">
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title={t("no_invoices_yet")}
            description={t("upload_a_gst_invoice_pdf_to_see_it_here")}
          />
        ) : (
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-slate-500">
                <th className="pb-3 pr-3 font-medium">{t("invoice_number_column")}</th>
                <th className="pb-3 pr-3 font-medium">{t("date_column")}</th>
                <th className="pb-3 pr-3 font-medium">{t("items_column")}</th>
                <th className="pb-3 font-medium">{t("filename_column")}</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {invoices.map((inv) => (
                <tr
                  key={inv._id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-surface-800/50 ${
                    selectedInvoice?._id === inv._id ? "bg-accent-muted" : ""
                  }`}
                >
                  <td className="py-3 pr-3">
                    {inv.metadata?.invoice_number ?? "N/A"}
                  </td>
                  <td className="py-3 pr-3">
                    {inv.metadata?.invoice_date ?? "N/A"}
                  </td>
                  <td className="py-3 pr-3">{inv.items?.length ?? 0}</td>
                  <td className="py-3 truncate font-mono text-xs text-slate-500">
                    {inv.filename}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedInvoice && (
        <div className="mt-5 rounded-xl border border-border bg-surface-950 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">
            {t("invoice_details")}
          </h3>
          <dl className="space-y-1.5 text-sm text-slate-400">
            <div className="flex gap-2">
              <dt className="text-slate-500">{t("invoice_label")}</dt>
              <dd>{selectedInvoice.metadata?.invoice_number ?? "N/A"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">{t("date_label")}</dt>
              <dd>{selectedInvoice.metadata?.invoice_date ?? "N/A"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">{t("seller_gstin_colon_label")}</dt>
              <dd className="truncate">
                {selectedInvoice.metadata?.seller_gstin ?? "N/A"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">{t("items_colon_label")}</dt>
              <dd>{selectedInvoice.items?.length ?? 0}</dd>
            </div>
          </dl>
          {selectedInvoice.items?.length > 0 && (
            <div className="mt-4 overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">{t("description")}</th>
                    <th className="pb-2 pr-3">{t("qty")}</th>
                    <th className="pb-2 pr-3">{t("unit_price")}</th>
                    <th className="pb-2">{t("total")}</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 pr-3">{it.sl_no}</td>
                      <td className="py-2 pr-3">{it.description}</td>
                      <td className="py-2 pr-3">{it.qty}</td>
                      <td className="py-2 pr-3">₹{it.unit_price}</td>
                      <td className="py-2">₹{it.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
