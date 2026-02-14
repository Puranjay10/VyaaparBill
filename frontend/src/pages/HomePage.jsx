import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-950 text-slate-100">
      {/* Subtle gradient mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 h-full w-full rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-28 sm:pb-32 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="w-full animate-fade-in-up text-sm font-medium uppercase tracking-wider text-accent" style={{ animationDelay: "0ms" }}>
              GST invoice → inventory, automatically
            </p>
            <h1 className="mt-4 w-full animate-fade-in-up text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl xl:text-9xl" style={{ animationDelay: "120ms" }}>
              VyaaparBill
            </h1>
            <h2 className="mt-8 w-full animate-fade-in-up text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl" style={{ animationDelay: "240ms" }}>
              Simplifying Invoicing.
              <br />
              <span className="text-accent">Automating Inventory.</span>
            </h2>
            <p className="mt-6 w-full animate-fade-in-up text-lg leading-relaxed text-slate-400 sm:text-xl" style={{ animationDelay: "360ms" }}>
              Drop your GST invoice PDFs—we extract items, update stock, and keep a clear{"\u00a0"}history.
            </p>
            <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "480ms" }}>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-[1.02] hover:bg-accent-hover hover:shadow-accent/30 active:scale-[0.98]"
              >
                Get started
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-white/5 bg-surface-900/30 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="animate-fade-in-up text-center text-2xl font-semibold text-white sm:text-3xl" style={{ animationDelay: "0ms" }}>
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-xl animate-fade-in-up text-center text-slate-400" style={{ animationDelay: "80ms" }}>
              Three steps. No spreadsheets.
            </p>
            <div className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {[
                {
                  step: "1",
                  title: "Upload invoice",
                  description: "Drag and drop a GST invoice PDF. We parse line items, quantities, and prices.",
                  icon: UploadIcon,
                },
                {
                  step: "2",
                  title: "Inventory updates",
                  description: "Stock is updated automatically. See product-wise quantity and last unit price.",
                  icon: InventoryIcon,
                },
                {
                  step: "3",
                  title: "Full history",
                  description: "Every uploaded invoice is stored. Search and review anytime.",
                  icon: InvoicesIcon,
                },
              ].map(({ step, title, description, icon: Icon }, i) => (
                <div
                  key={step}
                  className="relative animate-fade-in-up rounded-2xl border border-white/5 bg-surface-900/50 p-6 backdrop-blur transition-colors duration-200 hover:border-white/10 hover:bg-surface-900/70 sm:p-8"
                  style={{ animationDelay: `${160 + i * 100}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-800 text-slate-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value line */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <p className="animate-fade-in-up text-lg text-slate-400 sm:text-xl" style={{ animationDelay: "60ms" }}>
              Built for small businesses and traders who want
              <span className="font-medium text-white"> less data entry </span>
              and
              <span className="font-medium text-white"> clearer stock visibility</span>.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="animate-fade-in-up text-2xl font-semibold text-white sm:text-3xl" style={{ animationDelay: "0ms" }}>
              Ready to simplify your inventory?
            </h2>
            <p className="mt-3 animate-fade-in-up text-slate-400" style={{ animationDelay: "100ms" }}>
              Open the dashboard and upload your first invoice.
            </p>
            <Link
              to="/app"
              className="mt-8 inline-flex animate-fade-in-up items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-[1.02] hover:bg-accent-hover active:scale-[0.98]"
              style={{ animationDelay: "200ms" }}
            >
              Open dashboard
              <ArrowIcon />
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/5 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
            VyaaparBill · GST invoice parsing & inventory
          </div>
        </footer>
      </main>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function InvoicesIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
