import { useEffect, useState } from 'react';
import { candidatesApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function AdminCandidatesPage() {
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await candidatesApi.list({
          search: search || undefined,
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
  }, [search]);

  return (
    <div>
      <PageHeader
        title="All candidates"
        description="Every application across companies, with source attribution."
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search candidates"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c._id} className="border-b border-ink-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{c.name}</p>
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
        )}
      </div>
    </div>
  );
}
