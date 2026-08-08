import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Users } from 'lucide-react';
import { candidatesApi } from '../../services/api';
import { CANDIDATE_STATUSES, formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { useCandidateSources } from '../../hooks/useCandidateSources';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import SourceBadge from '../../components/ui/SourceBadge';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { PageSkeleton, TableSkeleton } from '../../components/ui/Skeleton';

function CandidateCard({ c }) {
  return (
    <Link
      to={`/app/candidates/${c._id}`}
      className="block rounded-xl border border-ink-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(28,34,44,0.04)] transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 font-semibold text-ink-900">{c.name}</p>
        <SourceBadge source={c.source} className="shrink-0" />
      </div>
      <p className="truncate text-xs text-ink-500">{c.email}</p>
      <p className="mt-2 truncate text-xs text-ink-600">{c.jobId?.title || 'Untitled role'}</p>
      <p className="mt-2 text-[11px] text-ink-400">{formatDate(c.appliedAt)}</p>
    </Link>
  );
}

export default function CandidatesPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { sources } = useCandidateSources();
  const [view, setView] = useState('pipeline');
  const [pipeline, setPipeline] = useState(null);
  const [statuses, setStatuses] = useState(CANDIDATE_STATUSES);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    source: params.get('source') || '',
    status: '',
    jobId: params.get('jobId') || '',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (view === 'pipeline') {
          const { data } = await candidatesApi.pipeline({
            jobId: filters.jobId || undefined,
            source: filters.source || undefined,
          });
          if (!cancelled) {
            setPipeline(data.data.columns);
            if (data.data.statuses?.length) setStatuses(data.data.statuses);
          }
        } else {
          const { data } = await candidatesApi.list({
            search: filters.search || undefined,
            source: filters.source || undefined,
            status: filters.status || undefined,
            jobId: filters.jobId || undefined,
            limit: 50,
          });
          if (!cancelled) setList(data.data.candidates);
        }
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [view, filters]);

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Pipeline and list views with source tracking from every application channel."
        actions={
          <div className="flex rounded-xl border border-ink-200 bg-white p-1 shadow-sm shadow-ink-900/5">
            <button
              type="button"
              onClick={() => setView('pipeline')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'pipeline'
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === 'list'
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        }
      />

      <div className="filter-bar md:grid-cols-4">
        <Input
          placeholder="Search name or email"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {filters.jobId && (
          <Button
            variant="secondary"
            onClick={() => {
              setFilters({ ...filters, jobId: '' });
              setParams({});
            }}
          >
            Clear job filter
          </Button>
        )}
      </div>

      {filters.source && (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-500">
          Showing candidates from
          <SourceBadge source={filters.source} />
        </p>
      )}

      {loading ? (
        view === 'pipeline' ? (
          <PageSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : view === 'pipeline' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const cards = (pipeline?.[status] || []).filter((c) => {
              if (filters.search) {
                const q = filters.search.toLowerCase();
                if (
                  !c.name.toLowerCase().includes(q) &&
                  !c.email.toLowerCase().includes(q)
                ) {
                  return false;
                }
              }
              return true;
            });
            return (
              <div
                key={status}
                className="w-72 shrink-0 rounded-2xl border border-ink-200/80 bg-ink-50/80 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-0.5">
                  <p className="text-sm font-semibold text-ink-800">{status}</p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-ink-500 shadow-sm">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cards.length === 0 ? (
                    <p className="px-1 py-8 text-center text-xs text-ink-400">
                      No candidates in this stage
                    </p>
                  ) : (
                    cards.map((c) => <CandidateCard key={c._id} c={c} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Publish jobs and sync applications, or wait for direct applies."
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link
                        to={`/app/candidates/${c._id}`}
                        className="font-semibold text-brand-700 hover:text-brand-800"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-ink-500">{c.email}</p>
                    </td>
                    <td>{c.jobId?.title || '—'}</td>
                    <td>
                      <SourceBadge source={c.source} />
                    </td>
                    <td>
                      <Badge status={c.status}>{c.status}</Badge>
                    </td>
                    <td className="text-ink-500">{formatDate(c.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
