import { cn, statusColor } from '../../utils/helpers';

export default function Badge({ children, status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize',
        status ? statusColor(status) : 'bg-ink-100 text-ink-600',
        className
      )}
    >
      {children ?? status}
    </span>
  );
}
