import { cn } from '../../utils/helpers';

const variants = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-700 focus-visible:ring-brand-500 disabled:bg-brand-300 disabled:shadow-none',
  secondary:
    'bg-white text-ink-800 border border-ink-200 shadow-sm shadow-ink-900/5 hover:bg-ink-50 hover:border-ink-300 focus-visible:ring-ink-400 disabled:bg-ink-50 disabled:text-ink-400',
  ghost:
    'bg-transparent text-ink-600 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-ink-400 disabled:text-ink-300',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500 disabled:bg-rose-300',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
