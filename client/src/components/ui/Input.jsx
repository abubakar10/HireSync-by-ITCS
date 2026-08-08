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
          'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900',
          'placeholder:text-ink-400',
          'transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15',
          'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
          className
        )}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-ink-500">{hint}</span>}
      {error && <span className="block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function Select({ label, error, children, className, hint, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink-700">{label}</span>}
      <select
        className={cn(
          'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900',
          'transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <span className="block text-xs text-ink-500">{hint}</span>}
      {error && <span className="block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function Textarea(props) {
  return <Input as="textarea" className={cn('min-h-[96px] resize-y', props.className)} {...props} />;
}
