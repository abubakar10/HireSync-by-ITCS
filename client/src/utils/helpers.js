export const formatDate = (value, opts = {}) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatSalary = (min, max, currency = 'USD') => {
  const fmt = (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n || 0);
  if (!min && !max) return 'Competitive';
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
};

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export const CANDIDATE_STATUSES = [
  'New',
  'Screening',
  'Shortlisted',
  'Interview',
  'Rejected',
  'Hired',
];

export const statusColor = (status) => {
  const map = {
    draft: 'bg-ink-100 text-ink-600',
    published: 'bg-brand-100 text-brand-700',
    closed: 'bg-amber-100 text-amber-800',
    archived: 'bg-ink-200 text-ink-500',
    New: 'bg-sky-100 text-sky-800',
    Screening: 'bg-violet-100 text-violet-800',
    Shortlisted: 'bg-brand-100 text-brand-800',
    Interview: 'bg-amber-100 text-amber-800',
    Rejected: 'bg-rose-100 text-rose-800',
    Hired: 'bg-emerald-100 text-emerald-800',
    success: 'bg-brand-100 text-brand-700',
    failed: 'bg-rose-100 text-rose-700',
    pending: 'bg-amber-100 text-amber-700',
    info: 'bg-ink-100 text-ink-600',
    connected: 'bg-brand-100 text-brand-700',
    not_connected: 'bg-ink-100 text-ink-600',
    available: 'bg-sky-100 text-sky-700',
    error: 'bg-rose-100 text-rose-700',
    not_published: 'bg-ink-100 text-ink-600',
  };
  return map[status] || 'bg-ink-100 text-ink-600';
};

export const getErrorMessage = (err, fallback = 'Request failed') => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return fallback;
};
