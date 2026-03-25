import { Link } from "react-router-dom";

const nav = [
  { id: "upload", label: "Upload", icon: UploadIcon },
  { id: "inventory", label: "Inventory", icon: InventoryIcon },
  { id: "invoices", label: "Invoices", icon: InvoicesIcon },
  { id: "analytics", label: "Analytics", icon: ChartIcon, to: "/analytics" },
];

export default function Sidebar({ currentView, onNavigate }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface-900/80 sm:w-56 sm:border-b-0 sm:border-r sm:shadow-sidebar">
      <Link to="/" className="flex items-center gap-2 px-4 py-5 sm:px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent">
          <DocIcon />
        </div>
        <span className="font-semibold text-white">VyaaparBill</span>
      </Link>
      <nav className="flex gap-1 px-2 pb-4 sm:flex-col sm:px-3" aria-label="Main">
        {nav.map(({ id, label, icon, to }) => (
          <NavItem
            key={id}
            id={id}
            label={label}
            icon={icon}
            to={to}
            currentView={currentView}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function NavItem({ id, label, icon, to, currentView, onNavigate }) {
  const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors sm:px-4 ${
    currentView === id
      ? "bg-accent/15 text-accent"
      : "text-slate-400 hover:bg-surface-800 hover:text-slate-200"
  }`;

  const iconEl = icon ? icon({ className: "h-5 w-5 shrink-0 opacity-80" }) : null;

  if (to) {
    return (
      <Link to={to} className={className}>
        {iconEl}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onNavigate(id)} className={className}>
      {iconEl}
      {label}
    </button>
  );
}

function DocIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function InvoicesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18m4-14v14m4-10v10M7 7v14M3 21h18" />
    </svg>
  );
}
