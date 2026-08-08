export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500 sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,34,44,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
      </div>
    </div>
  );
}
