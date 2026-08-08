import { cn } from '../../utils/helpers';

/** Presentation colors only — source labels always come from candidate records / API. */
const SOURCE_STYLES = {
  Indeed: 'bg-sky-100 text-sky-800 ring-sky-200',
  LinkedIn: 'bg-blue-100 text-blue-800 ring-blue-200',
  Monster: 'bg-violet-100 text-violet-800 ring-violet-200',
  Glassdoor: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  ZipRecruiter: 'bg-teal-100 text-teal-800 ring-teal-200',
  JobStreet: 'bg-orange-100 text-orange-900 ring-orange-200',
  Kalibrr: 'bg-rose-100 text-rose-800 ring-rose-200',
  'OnlineJobs.ph': 'bg-amber-100 text-amber-900 ring-amber-200',
  JobsDB: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  PhilJobNet: 'bg-cyan-100 text-cyan-900 ring-cyan-200',
  Naukri: 'bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200',
  Shine: 'bg-lime-100 text-lime-900 ring-lime-200',
  Foundit: 'bg-pink-100 text-pink-800 ring-pink-200',
  Direct: 'bg-ink-100 text-ink-700 ring-ink-200',
};

export const sourceColor = (source) =>
  SOURCE_STYLES[source] || 'bg-ink-100 text-ink-700 ring-ink-200';

export const sourceChartColor = (source, index = 0) => {
  const palette = {
    Indeed: '#0284c7',
    LinkedIn: '#2563eb',
    Monster: '#7c3aed',
    Glassdoor: '#059669',
    ZipRecruiter: '#0d9488',
    JobStreet: '#ea580c',
    Kalibrr: '#e11d48',
    'OnlineJobs.ph': '#d97706',
    JobsDB: '#4f46e5',
    PhilJobNet: '#0891b2',
    Naukri: '#c026d3',
    Shine: '#65a30d',
    Foundit: '#db2777',
    Direct: '#525c6e',
  };
  const fallback = ['#2d8f68', '#4aa882', '#8592a8', '#f59e0b', '#0ea5e9', '#e11d48'];
  return palette[source] || fallback[index % fallback.length];
};

/**
 * Displays the candidate source from the database record.
 * Pass `source` from API data — do not invent labels in the UI.
 */
export default function SourceBadge({ source, className, showLabel = false }) {
  if (!source) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset',
        sourceColor(source),
        className
      )}
      title={`Source: ${source}`}
    >
      {showLabel && <span className="opacity-70">Source</span>}
      {source}
    </span>
  );
}
