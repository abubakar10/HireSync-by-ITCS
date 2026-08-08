import { useEffect, useState } from 'react';
import { jobsApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
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
      <PageHeader title="All jobs" description="Jobs created by every recruiter on the platform." />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search jobs"
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
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Recruiter</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b border-ink-50">
                    <td className="px-4 py-3 font-semibold text-ink-900">{job.title}</td>
                    <td className="px-4 py-3">{job.company}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {job.createdBy?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={job.status}>{job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(job.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-500">
        For distribution and edits, open the recruiter workspace or create a recruiter login.
      </p>
    </div>
  );
}
