import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { candidatesApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { useCandidateSources } from '../../hooks/useCandidateSources';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import SourceBadge from '../../components/ui/SourceBadge';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function AdminCandidatesPage() {
  const toast = useToast();
  const { sources } = useCandidateSources();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await candidatesApi.list({
          search: search || undefined,
          source: source || undefined,
          limit: 50,
        });
        if (!cancelled) setCandidates(data.data.candidates);
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
  }, [search, source]);

  return (
    <div>
      <PageHeader
        title="All candidates"
        description="Every application across companies, with source attribution from the database."
      />
      <div className="filter-bar md:grid-cols-2 md:max-w-xl">
        <Input
          placeholder="Search candidates"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div className="panel overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates found"
            description="Applications will appear here after direct applies or board sync demos."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Job</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <p className="font-semibold text-ink-900">{c.name}</p>
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
        )}
      </div>
    </div>
  );
}
