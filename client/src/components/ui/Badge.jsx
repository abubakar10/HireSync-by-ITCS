import { cn, statusColor } from '../../utils/helpers';

export default function Badge({ children, status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize tracking-wide',
        status ? statusColor(status) : 'bg-ink-100 text-ink-600',
        className
      )}
    >
      {children ?? String(status || '').replaceAll('_', ' ')}
    </span>
  );
}

export function DemoBadge({ className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800',
        className
      )}
    >
      Demo
    </span>
  );
}
