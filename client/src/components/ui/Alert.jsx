import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/helpers';

const styles = {
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  error: 'border-rose-200 bg-rose-50 text-rose-950',
  success: 'border-brand-200 bg-brand-50 text-brand-950',
};

const icons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: Info,
};

export default function Alert({
  tone = 'info',
  title,
  children,
  className,
  icon: IconProp,
}) {
  const Icon = IconProp || icons[tone] || Info;
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', styles[tone], className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && (
          <div className={cn(title ? 'mt-0.5 opacity-90' : '', 'leading-relaxed')}>{children}</div>
        )}
      </div>
    </div>
  );
}
