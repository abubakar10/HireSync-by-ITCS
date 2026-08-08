import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Shuffle, Sparkles } from 'lucide-react';
import { integrationsApi } from '../services/api';
import { getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import Button from './ui/Button';
import Input, { Select, Textarea } from './ui/Input';
import Modal from './ui/Modal';
import Badge from './ui/Badge';

/**
 * Shared DEMO simulator — posts through the inbound webhook pipeline
 * without real job board credentials.
 */
export default function SimulateApplicationModal({
  open,
  onClose,
  onSuccess,
  title = 'Simulate Application',
}) {
  const toast = useToast();
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [options, setOptions] = useState({ options: [], applicants: [], boards: [] });
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    externalJobId: '',
    board: 'Indeed',
    name: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
  });

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setResult(null);
    setLoadingOptions(true);
    integrationsApi
      .simulateOptions()
      .then(({ data }) => {
        if (cancelled) return;
        const opts = data.data;
        setOptions(opts);
        const first = opts.options?.[0];
        const preset = opts.applicants?.[0];
        setForm({
          externalJobId: first?.externalJobId || '',
          board: first?.board || opts.boards?.[0] || 'Indeed',
          name: preset?.name || 'Maya Santillan',
          email: '',
          phone: preset?.phone || '+63 917 555 0142',
          resumeUrl: preset?.resumeUrl || 'https://example.com/resumes/maya-santillan.pdf',
          coverLetter:
            preset?.coverLetter ||
            'I am excited to apply for this role through the job board webhook demo.',
        });
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedOption = useMemo(
    () => options.options.find((o) => o.externalJobId === form.externalJobId),
    [options.options, form.externalJobId]
  );

  const applyPreset = (preset) => {
    setForm((f) => ({
      ...f,
      name: preset.name,
      phone: preset.phone,
      resumeUrl: preset.resumeUrl,
      coverLetter: preset.coverLetter,
      email: '',
    }));
  };

  const randomizeApplicant = () => {
    if (!options.applicants?.length) return;
    const preset =
      options.applicants[Math.floor(Math.random() * options.applicants.length)];
    applyPreset(preset);
  };

  const submit = async () => {
    if (!options.options.length) {
      toast.error('Publish a job to a board first, then simulate an application.');
      return;
    }
    setSimulating(true);
    setResult(null);
    try {
      const { data } = await integrationsApi.simulate({
        board: selectedOption?.board || form.board,
        externalJobId: form.externalJobId || undefined,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone,
        resumeUrl: form.resumeUrl,
        coverLetter: form.coverLetter,
        useRandomApplicant: !form.name,
      });
      setResult(data.data);
      toast.success(data.message || 'Application synced (DEMO)');
      onSuccess?.(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Simulate another
            </Button>
            <Link to="/app/candidates">
              <Button onClick={onClose}>Open candidate pipeline</Button>
            </Link>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={simulating || loadingOptions}
              onClick={submit}
              disabled={!options.options.length}
            >
              <Sparkles className="h-4 w-4" />
              Run inbound sync
            </Button>
          </>
        )
      }
    >
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <strong>DEMO only.</strong> This posts to the same webhook handler boards would call
        (<code className="mx-1 rounded bg-white px-1">POST /api/integrations/:board/applications</code>).
        No real Indeed / LinkedIn / JobStreet credentials are used.
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-700" />
            <div>
              <p className="font-semibold text-brand-900">{result.message}</p>
              <p className="mt-1 text-sm text-brand-800">
                Candidate is in the <strong>{result.pipelineColumn}</strong> column with source{' '}
                <Badge className="ml-1">{result.candidate?.source}</Badge>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Applicant</p>
              <p className="mt-1 font-semibold text-ink-900">{result.candidate?.name}</p>
              <p className="text-ink-600">{result.candidate?.email}</p>
              <p className="text-ink-500">{result.candidate?.phone}</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Matched job</p>
              <p className="mt-1 font-semibold text-ink-900">{result.job?.title}</p>
              <p className="text-ink-600">{result.job?.company}</p>
              <p className="mt-2 font-mono text-xs text-ink-500">
                Ext ID: {result.distribution?.externalJobId}
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-500">
            Webhook path used: <code>{result.webhookPath}</code> · {result.durationMs} ms · mode: mock
          </p>
        </div>
      ) : loadingOptions ? (
        <p className="py-8 text-center text-sm text-ink-500">Loading published board jobs…</p>
      ) : !options.options.length ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-900">
          <p className="font-semibold">No published distributions yet</p>
          <p className="mt-1">
            Open a job → Distribute → publish to Indeed (or another board), then come back to simulate
            an inbound application.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Select
            label="Published board posting"
            value={form.externalJobId}
            onChange={(e) => {
              const next = options.options.find((o) => o.externalJobId === e.target.value);
              setForm((f) => ({
                ...f,
                externalJobId: e.target.value,
                board: next?.board || f.board,
              }));
            }}
          >
            {options.options.map((o) => (
              <option key={o.externalJobId} value={o.externalJobId}>
                {o.board} · {o.job.title} ({o.job.company})
              </option>
            ))}
          </Select>

          {selectedOption && (
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-600">
              Matching via <strong>externalJobId</strong>{' '}
              <code className="rounded bg-white px-1">{selectedOption.externalJobId}</code>
              {' · '}
              Source will be saved as <Badge>{selectedOption.board}</Badge>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-ink-700">Applicant presets</p>
            <Button type="button" size="sm" variant="secondary" onClick={randomizeApplicant}>
              <Shuffle className="h-3.5 w-3.5" />
              Randomize
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {options.applicants?.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  form.name === preset.name
                    ? 'border-brand-400 bg-brand-50 text-brand-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              placeholder="Auto-generated if empty"
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
              value={form.resumeUrl}
              onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
            />
          </div>
          <Textarea
            label="Cover letter"
            rows={4}
            value={form.coverLetter}
            onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
          />
        </div>
      )}
    </Modal>
  );
}
