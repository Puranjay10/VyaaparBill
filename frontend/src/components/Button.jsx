const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20",
  secondary:
    "bg-surface-800 text-slate-200 border border-border hover:bg-surface-700 hover:border-border-hover active:scale-[0.98]",
  ghost:
    "bg-transparent text-slate-300 hover:bg-white/5 active:scale-[0.98]",
};

export default function Button({
  children,
  variant = "primary",
  disabled = false,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:pointer-events-none disabled:opacity-50";
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
