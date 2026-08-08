import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Users } from 'lucide-react';
import { candidatesApi } from '../../services/api';
import { CANDIDATE_STATUSES, formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { PageSkeleton, TableSkeleton } from '../../components/ui/Skeleton';

function CandidateCard({ c }) {
  return (
    <Link
      to={`/app/candidates/${c._id}`}
      className="block rounded-xl border border-ink-200 bg-white p-3 shadow-sm transition hover:border-brand-300"
    >
      <p className="font-semibold text-ink-900">{c.name}</p>
      <p className="truncate text-xs text-ink-500">{c.email}</p>
      <p className="mt-2 truncate text-xs text-ink-600">
        {c.jobId?.title || 'Job'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge>{c.source}</Badge>
        <span className="text-[11px] text-ink-400">{formatDate(c.appliedAt)}</span>
      </div>
    </Link>
  );
}

export default function CandidatesPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('pipeline');
  const [pipeline, setPipeline] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    source: '',
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
          });
          if (!cancelled) setPipeline(data.data.columns);
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
        description="Pipeline and list views with source tracking across every board."
        actions={
          <div className="flex rounded-lg border border-ink-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView('pipeline')}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                view === 'pipeline' ? 'bg-brand-50 text-brand-800' : 'text-ink-500'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                view === 'list' ? 'bg-brand-50 text-brand-800' : 'text-ink-500'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-ink-200 bg-white p-4 md:grid-cols-4">
        <Input
          placeholder="Search name or email"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
        >
          <option value="">All sources</option>
          {['Indeed', 'LinkedIn', 'Monster', 'JobStreet', 'Kalibrr', 'OnlineJobs.ph', 'JobsDB', 'Direct'].map(
            (s) => (
              <option key={s}>{s}</option>
            )
          )}
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {CANDIDATE_STATUSES.map((s) => (
            <option key={s}>{s}</option>
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

      {loading ? (
        view === 'pipeline' ? (
          <PageSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : view === 'pipeline' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {CANDIDATE_STATUSES.map((status) => {
            const cards = (pipeline?.[status] || []).filter((c) => {
              if (filters.source && c.source !== filters.source) return false;
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
                className="w-72 shrink-0 rounded-2xl border border-ink-200 bg-ink-50/80 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-800">{status}</p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-ink-500">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cards.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-ink-400">Empty</p>
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
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id} className="border-b border-ink-50 hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <Link to={`/app/candidates/${c._id}`} className="font-semibold text-brand-700">
                        {c.name}
                      </Link>
                      <p className="text-xs text-ink-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">{c.jobId?.title || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge>{c.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={c.status}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(c.appliedAt)}</td>
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
