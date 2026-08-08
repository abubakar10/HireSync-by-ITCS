import { cn } from '../../utils/helpers';

export default function Input({
  label,
  error,
  className,
  id,
  hint,
  as: Component = 'input',
  ...props
}) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-ink-700">{label}</span>
      )}
      <Component
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
          className
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-ink-450 text-ink-500">{hint}</span>}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Select({ label, error, children, className, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink-700">{label}</span>}
      <select
        className={cn(
          'w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Textarea(props) {
  return <Input as="textarea" {...props} />;
}
