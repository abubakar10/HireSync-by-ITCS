import { useEffect, useState } from 'react';
import { activityApi } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Activity } from 'lucide-react';

export default function ActivityLogsPage({ integrationOnly = false }) {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    board: '',
    status: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          ...filters,
          board: filters.board || undefined,
          status: filters.status || undefined,
          action: filters.action || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          limit: 25,
        };
        const { data } = integrationOnly
          ? await activityApi.integrationLogs(params)
          : await activityApi.list(params);
        if (!cancelled) {
          setLogs(data.data.logs);
          setPagination(data.data.pagination);
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
  }, [filters, integrationOnly]);

  return (
    <div>
      <PageHeader
        title={integrationOnly ? 'Integration logs' : 'Activity logs'}
        description={
          integrationOnly
            ? 'Publish, sync, and connection events across job boards.'
            : 'Audit trail for jobs, candidates, auth, and integrations.'
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-ink-200 bg-white p-4 md:grid-cols-5">
        <Input
          placeholder="Board"
          value={filters.board}
          onChange={(e) => setFilters({ ...filters, board: e.target.value, page: 1 })}
        />
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="info">Info</option>
        </Select>
        <Input
          placeholder="Action"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
        />
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {loading ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState icon={Activity} title="No logs match" description="Adjust filters or perform an action." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Board</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Response</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-ink-50 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{log.action}</p>
                      <p className="text-xs text-ink-500">
                        {log.entity}
                        {log.details?.jobTitle ? ` · ${log.details.jobTitle}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">{log.board || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={log.status}>{log.status}</Badge>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-ink-600">
                      {log.response || JSON.stringify(log.details || {}).slice(0, 80)}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {log.durationMs != null ? `${log.durationMs} ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page >= pagination.pages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
