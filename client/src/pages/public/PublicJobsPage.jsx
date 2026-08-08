import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { jobsApi } from '../../services/api';
import { formatSalary, formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/PageHeader';
import Button from '../../components/ui/Button';

export default function PublicJobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    employmentType: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await jobsApi.list({
          ...filters,
          limit: 10,
        });
        if (!cancelled) {
          setJobs(data.data.jobs);
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
  }, [filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Open roles"
        description="Browse published positions. Apply directly — applications are tracked as Direct source."
      />

      <div className="filter-bar sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search title or company"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <Input
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value, page: 1 })}
        />
        <Select
          value={filters.employmentType}
          onChange={(e) => setFilters({ ...filters, employmentType: e.target.value, page: 1 })}
        >
          <option value="">All types</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
          <option>Remote</option>
        </Select>
      </div>

      {loading ? (
        <div className="panel">
          <TableSkeleton />
        </div>
      ) : jobs.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Search}
            title="No published jobs match"
            description="Try clearing filters or check back after recruiters publish new roles."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="block rounded-2xl border border-ink-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,34,44,0.04)] transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900">{job.title}</h2>
                  <p className="mt-1 text-sm text-ink-600">{job.company}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <Badge>{job.employmentType}</Badge>
                    <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-ink-400">Posted {formatDate(job.publishedAt)}</p>
                  <span className="mt-2 inline-flex h-8 items-center rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white">
                    View role
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-500">
            Page {filters.page} of {pagination.pages}
          </span>
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
