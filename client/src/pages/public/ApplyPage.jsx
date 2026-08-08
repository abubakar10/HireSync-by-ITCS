import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { candidatesApi, jobsApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';

export default function ApplyPage() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
  });

  useEffect(() => {
    let cancelled = false;
    jobsApi
      .get(id)
      .then(({ data }) => {
        if (!cancelled) setJob(data.data.job);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await candidatesApi.create({
        ...form,
        jobId: id,
      });
      toast.success('Application submitted');
      navigate(`/jobs/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit application'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <PageSkeleton />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Job not found</h1>
        <p className="mt-2 text-sm text-ink-500">
          This role may have been closed or the link is incorrect.
        </p>
        <Link to="/jobs" className="mt-4 inline-block font-semibold text-brand-700">
          Back to open roles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
        Apply for {job.title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        {job.company} · Your application will be recorded with source Direct in HireSync
      </p>

      <Card className="mt-6">
        <CardBody>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Resume URL"
              placeholder="https://..."
              value={form.resumeUrl}
              onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
              hint="Paste a link to your resume for this demo"
            />
            <Textarea
              label="Cover letter"
              rows={5}
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit" loading={submitting}>
                Submit application
              </Button>
              <Link to={`/jobs/${id}`}>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
