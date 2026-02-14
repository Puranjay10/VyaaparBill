import { useRef, useState } from "react";
import Button from "./Button";
import Card from "./Card";
import Spinner from "./Spinner";

export default function UploadCard({
  file,
  setFile,
  uploading,
  onUpload,
  uploadResult,
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    onUpload(e);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f?.type === "application/pdf") setFile(f);
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }

  function onDragLeave() {
    setDragActive(false);
  }

  return (
    <Card title="Upload Invoice PDF">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragActive
              ? "border-accent bg-accent/10"
              : "border-border bg-surface-950/50 hover:border-border-hover hover:bg-surface-900/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-800 text-slate-500">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-300">
            {file ? file.name : "Drop PDF here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-slate-500">GST invoice PDF only</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {file && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-surface-800 px-3 py-2 text-sm text-slate-300">
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="rounded p-0.5 text-slate-500 hover:bg-surface-700 hover:text-slate-300"
                aria-label="Remove file"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? (
              <>
                <Spinner className="h-4 w-4" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </form>

      {uploadResult && (
        <div className="mt-6 rounded-xl border border-border bg-surface-950 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Upload result
          </h3>
          <dl className="space-y-1.5 text-sm text-slate-400">
            <div className="flex gap-2">
              <dt className="text-slate-500">Invoice:</dt>
              <dd>{uploadResult.metadata?.invoice_number ?? "N/A"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Date:</dt>
              <dd>{uploadResult.metadata?.invoice_date ?? "N/A"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Seller GSTIN:</dt>
              <dd className="truncate">{uploadResult.metadata?.seller_gstin ?? "N/A"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Items parsed:</dt>
              <dd>{uploadResult.items?.length ?? 0}</dd>
            </div>
          </dl>
          {uploadResult.items?.length > 0 && (
            <div className="mt-4 overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-slate-500">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Description</th>
                    <th className="pb-2 pr-3">Qty</th>
                    <th className="pb-2 pr-3">Unit Price</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {uploadResult.items.map((it, idx) => (
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
