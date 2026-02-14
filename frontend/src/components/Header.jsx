export default function Header() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          VyaaparBill
        </h1>
        <p className="mt-1 text-slate-400">
          Upload GST invoices → auto-update inventory
        </p>
      </div>
      <span className="rounded-full border border-border bg-surface-800 px-3 py-1.5 text-xs font-medium text-slate-400">
        Demo Dashboard
      </span>
    </header>
  );
}
