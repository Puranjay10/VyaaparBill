export default function Card({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface-900/80 p-6 shadow-card backdrop-blur-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
