import { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { jobsApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

/** Admin view of all jobs across recruiters */
export default function AdminJobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await jobsApi.list({ search: search || undefined, limit: 50 });
        if (!cancelled) setJobs(data.data.jobs);
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
        title="All jobs"
        description="Jobs created by every recruiter on the platform."
      />
      <div className="filter-bar max-w-sm sm:max-w-none sm:grid-cols-1 md:max-w-sm">
        <Input
          placeholder="Search jobs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="panel overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description="Recruiters have not created openings yet, or none match your search."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Recruiter</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td className="font-semibold text-ink-900">{job.title}</td>
                    <td>{job.company}</td>
                    <td className="text-ink-600">{job.createdBy?.name || '—'}</td>
                    <td>
                      <Badge status={job.status}>{job.status}</Badge>
                    </td>
                    <td className="text-ink-500">{formatDate(job.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-500">
        For distribution and edits, open the recruiter workspace with a recruiter account.
      </p>
    </div>
  );
}
