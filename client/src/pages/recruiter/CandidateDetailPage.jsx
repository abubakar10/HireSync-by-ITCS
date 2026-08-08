import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { candidatesApi } from '../../services/api';
import {
  CANDIDATE_STATUSES,
  formatDateTime,
  getErrorMessage,
} from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import SourceBadge from '../../components/ui/SourceBadge';
import Button from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Input';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await candidatesApi.get(id);
      setCandidate(data.data.candidate);
      setStatus(data.data.candidate.status);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await candidatesApi.update(id, {
        status,
        note: note || undefined,
      });
      setCandidate(data.data.candidate);
      setNote('');
      toast.success('Candidate updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!candidate) return null;

  return (
    <div>
      <Link
        to="/app/candidates"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Candidates
      </Link>

      <PageHeader
        title={candidate.name}
        description={`${candidate.email}${candidate.phone ? ` · ${candidate.phone}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={candidate.source} showLabel />
            <Badge status={candidate.status}>{candidate.status}</Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Application" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-ink-500">Came from</span>
                <SourceBadge source={candidate.source} />
                <span className="text-ink-400">·</span>
                <span className="text-ink-500">
                  Applied {formatDateTime(candidate.appliedAt)}
                </span>
              </div>
              <p>
                <span className="text-ink-500">Job: </span>
                <span className="font-semibold text-ink-900">
                  {candidate.jobId?.title || '—'}
                </span>
                {candidate.jobId?.company && (
                  <span className="text-ink-500"> · {candidate.jobId.company}</span>
                )}
              </p>
              {candidate.resumeUrl && (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand-700"
                >
                  View resume <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <div>
                <p className="mb-1 font-medium text-ink-800">Cover letter</p>
                <p className="whitespace-pre-wrap rounded-xl bg-ink-50 p-3 text-ink-700">
                  {candidate.coverLetter || 'No cover letter provided.'}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <ol className="space-y-4">
                {(candidate.timeline || [])
                  .slice()
                  .reverse()
                  .map((item) => (
                    <li key={item._id || item.createdAt} className="relative border-l-2 border-ink-100 pl-4">
                      <p className="text-sm font-semibold text-ink-900">{item.action}</p>
                      <p className="text-xs text-ink-500">
                        {formatDateTime(item.createdAt)}
                        {item.fromStatus && item.toStatus
                          ? ` · ${item.fromStatus} → ${item.toStatus}`
                          : ''}
                      </p>
                      {item.note && (
                        <p className="mt-1 text-sm text-ink-600">{item.note}</p>
                      )}
                    </li>
                  ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Update status" />
            <CardBody className="space-y-3">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {CANDIDATE_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <Textarea
                label="Internal note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context for your team"
              />
              <Button className="w-full" loading={saving} onClick={save}>
                Save changes
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Internal notes" />
            <CardBody className="space-y-3">
              {(candidate.notes || []).length === 0 ? (
                <p className="text-sm text-ink-500">No notes yet.</p>
              ) : (
                candidate.notes
                  .slice()
                  .reverse()
                  .map((n) => (
                    <div key={n._id} className="rounded-xl bg-ink-50 p-3 text-sm">
                      <p className="text-ink-800">{n.text}</p>
                      <p className="mt-1 text-xs text-ink-400">
                        {formatDateTime(n.createdAt)}
                        {n.createdBy?.name ? ` · ${n.createdBy.name}` : ''}
                      </p>
                    </div>
                  ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
