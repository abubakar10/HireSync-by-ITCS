import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight text-ink-900">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
