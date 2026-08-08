import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { jobsApi } from '../../services/api';
import { formatDate, formatSalary, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageSkeleton } from '../../components/ui/Skeleton';

export default function PublicJobDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await jobsApi.get(id);
        if (!cancelled) setJob(data.data.job);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Job not found'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <PageSkeleton />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Job not available</h1>
        <Link to="/jobs" className="mt-4 inline-block text-brand-700">
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" />
        All jobs
      </Link>

      <div className="mt-4 rounded-2xl border border-ink-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,34,44,0.04)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-900">{job.title}</h1>
            <p className="mt-2 text-lg text-ink-600">{job.company}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <Badge>{job.employmentType}</Badge>
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
              <span>Posted {formatDate(job.publishedAt)}</span>
            </div>
          </div>
          <Link to={`/jobs/${job._id}/apply`}>
            <Button size="lg">Apply now</Button>
          </Link>
        </div>

        {job.skills?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="rounded-md bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-sm mt-8 max-w-none text-ink-700">
          <h2 className="font-display text-lg font-semibold text-ink-900">About the role</h2>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
      </div>
    </div>
  );
}
