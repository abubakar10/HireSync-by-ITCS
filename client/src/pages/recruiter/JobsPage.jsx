import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

      <div className="filter-bar lg:grid-cols-5">
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

      <div className="panel overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Create a draft or publish a role to start distributing."
            actionLabel="Create job"
            onAction={() => navigate('/app/jobs/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <p className="font-semibold text-ink-900">{job.title}</p>
                      <p className="text-xs text-ink-500">{job.company}</p>
                    </td>
                    <td className="text-ink-600">{job.location}</td>
                    <td>{job.employmentType}</td>
                    <td className="text-ink-600">
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </td>
                    <td>
                      <Badge status={job.status}>{job.status}</Badge>
                    </td>
                    <td className="text-ink-500">{formatDate(job.createdAt)}</td>
                    <td className="text-right">
                      <Link
                        to={`/app/jobs/${job._id}`}
                        className="font-semibold text-brand-700 hover:text-brand-800"
                      >
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
