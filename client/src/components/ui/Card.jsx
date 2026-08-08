import { cn } from '../../utils/helpers';

export function Card({ children, className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200/80 bg-white shadow-[0_1px_2px_rgba(28,34,44,0.04)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4',
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold tracking-tight text-ink-900">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
