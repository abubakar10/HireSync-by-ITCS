import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { jobsApi } from '../../services/api';
import { formatDate, formatSalary, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/Modal';

export default function JobDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await jobsApi.get(id);
      setJob(data.data.job);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const publish = async () => {
    setBusy(true);
    try {
      const { data } = await jobsApi.publish(id);
      setJob(data.data.job);
      toast.success('Job published');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    setBusy(true);
    try {
      await jobsApi.remove(id);
      toast.success('Job archived');
      navigate('/app/jobs');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setConfirmArchive(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!job) return null;

  return (
    <div>
      <Link
        to="/app/jobs"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Jobs
      </Link>

      <PageHeader
        title={job.title}
        description={`${job.company} · ${job.location}`}
        actions={
          <>
            {job.status !== 'published' && (
              <Button loading={busy} onClick={publish}>
                Publish
              </Button>
            )}
            <Link to={`/app/jobs/${job._id}/distribute`}>
              <Button variant="secondary">
                <Share2 className="h-4 w-4" />
                Distribute
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => setConfirmArchive(true)}>
              Archive
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="font-display text-lg font-semibold text-ink-900">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {job.description}
            </p>
            {job.skills?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-md bg-ink-50 px-2.5 py-1 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Status</span>
              <Badge status={job.status}>{job.status}</Badge>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Type</span>
              <span className="font-medium text-ink-800">{job.employmentType}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Salary</span>
              <span className="font-medium text-ink-800">
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Created</span>
              <span>{formatDate(job.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Published</span>
              <span>{formatDate(job.publishedAt)}</span>
            </div>
            <Link
              to={`/app/candidates?jobId=${job._id}`}
              className="mt-2 inline-block font-semibold text-brand-700"
            >
              View candidates →
            </Link>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={archive}
        title="Archive this job?"
        message="Archived jobs stop appearing in active lists. You can still find them with filters."
        confirmLabel="Archive"
        danger
        loading={busy}
      />
    </div>
  );
}
