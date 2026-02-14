const typeStyles = {
  error: "border-red-500/40 bg-red-500/15 text-red-300",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  info: "border-accent/40 bg-accent/15 text-slate-200",
};

export default function Toast({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(({ id, message, type }) => (
        <div
          key={id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${typeStyles[type] ?? typeStyles.info}`}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
