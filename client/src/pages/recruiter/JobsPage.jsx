import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase } from 'lucide-react';
import { jobsApi } from '../../services/api';
import { formatDate, formatSalary, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function JobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    location: '',
    employmentType: '',
    sort: 'newest',
    page: 1,
  });
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await jobsApi.list({ ...filters, limit: 10 });
      setJobs(data.data.jobs);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Search, filter, and manage every opening across your company."
        actions={
          <Link to="/app/jobs/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create job
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-ink-200 bg-white p-4 lg:grid-cols-5">
        <Input
          placeholder="Search jobs"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        />
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </Select>
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
        <Select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {loading ? (
          <TableSkeleton />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Create a draft or publish a role to start distributing."
            actionLabel="Create job"
            onAction={() => (window.location.href = '/app/jobs/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/80 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Salary</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b border-ink-50 hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-900">{job.title}</p>
                      <p className="text-xs text-ink-500">{job.company}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{job.location}</td>
                    <td className="px-4 py-3">{job.employmentType}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={job.status}>{job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/app/jobs/${job._id}`} className="font-semibold text-brand-700">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-500">{pagination.total} jobs</p>
          <div className="flex gap-2">
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
        </div>
      )}
    </div>
  );
}
