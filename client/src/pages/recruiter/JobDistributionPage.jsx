import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Globe2,
  Loader2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { distributionApi } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';

const PRIMARY_BOARDS = [
  'Indeed',
  'LinkedIn',
  'Monster',
  'JobStreet',
  'Kalibrr',
  'OnlineJobs.ph',
  'JobsDB',
  'PhilJobNet',
];

function ProgressBar({ current, total }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-ink-500">
        <span>
          Publishing {current} of {total} boards (DEMO)
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BoardStatusIcon({ state }) {
  if (state === 'publishing') {
    return <Loader2 className="h-4 w-4 animate-spin text-brand-600" />;
  }
  if (state === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-brand-600" />;
  }
  if (state === 'failed') {
    return <XCircle className="h-4 w-4 text-rose-600" />;
  }
  return null;
}

export default function JobDistributionPage() {
  const { id } = useParams();
  const toast = useToast();
  const [payload, setPayload] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [boardProgress, setBoardProgress] = useState({});
  const [sessionResults, setSessionResults] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await distributionApi.history(id, { limit: 40 });
      setHistory(data.data.history || []);
    } catch {
      // non-blocking
    }
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await distributionApi.forJob(id);
      setPayload(data.data);
      const primaryNames = data.data.primaryBoards || PRIMARY_BOARDS;
      const preselect = data.data.boards
        .filter(
          (b) =>
            primaryNames.includes(b.name) &&
            b.publishedStatus !== 'published'
        )
        .map((b) => b.name);
      setSelected((prev) => (prev.length ? prev : preselect));
      await loadHistory();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, loadHistory, toast]);

  useEffect(() => {
    load();
  }, [id]);

  const primaryBoards = useMemo(() => {
    if (!payload) return [];
    const names = payload.primaryBoards || PRIMARY_BOARDS;
    return payload.boards.filter((b) => names.includes(b.name));
  }, [payload]);

  const otherBoards = useMemo(() => {
    if (!payload) return [];
    const names = new Set(payload.primaryBoards || PRIMARY_BOARDS);
    return payload.boards.filter((b) => !names.has(b.name));
  }, [payload]);

  const toggle = (name) => {
    if (publishing) return;
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectPrimary = () => {
    if (publishing) return;
    setSelected(primaryBoards.map((b) => b.name));
  };

  const clearSelection = () => {
    if (publishing) return;
    setSelected([]);
  };

  const copyId = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('External job ID copied');
    } catch {
      toast.info(value);
    }
  };

  /**
   * Publish boards one-by-one so the UI can show live progress per board.
   * Each call still hits the mock adapter architecture on the server.
   */
  const publish = async () => {
    if (!selected.length) {
      toast.info('Select at least one board');
      return;
    }

    setPublishing(true);
    setSessionResults([]);
    setProgress({ current: 0, total: selected.length });

    const initial = {};
    selected.forEach((name) => {
      initial[name] = { state: 'queued', message: 'Queued', externalJobId: null };
    });
    setBoardProgress(initial);

    const results = [];

    for (let i = 0; i < selected.length; i++) {
      const board = selected[i];
      setBoardProgress((prev) => ({
        ...prev,
        [board]: { state: 'publishing', message: 'Publishing via DEMO mock adapter…', externalJobId: null },
      }));
      setProgress({ current: i, total: selected.length });

      try {
        const { data } = await distributionApi.publish({
          jobId: id,
          boards: [board],
        });
        const result = data.data.results?.[0];
        const entry = {
          board,
          success: !!result?.success,
          status: result?.status,
          externalJobId: result?.externalJobId || null,
          message: result?.message || data.message,
          durationMs: result?.durationMs,
          isDemo: true,
        };
        results.push(entry);
        setBoardProgress((prev) => ({
          ...prev,
          [board]: {
            state: entry.success ? 'success' : 'failed',
            message: entry.message,
            externalJobId: entry.externalJobId,
            durationMs: entry.durationMs,
          },
        }));
      } catch (err) {
        const message = getErrorMessage(err, `[DEMO] Publish failed for ${board}`);
        results.push({
          board,
          success: false,
          status: 'failed',
          externalJobId: null,
          message,
          isDemo: true,
        });
        setBoardProgress((prev) => ({
          ...prev,
          [board]: { state: 'failed', message, externalJobId: null },
        }));
      }

      setProgress({ current: i + 1, total: selected.length });
      setSessionResults([...results]);
    }

    const ok = results.filter((r) => r.success).length;
    toast.success(`[DEMO] Finished: ${ok}/${results.length} boards published via mock adapters`);
    setPublishing(false);
    await load();
  };

  if (loading) return <PageSkeleton />;
  if (!payload) return null;

  const { job } = payload;

  const renderBoardCard = (board) => {
    const checked = selected.includes(board.name);
    const live = boardProgress[board.name];
    const statusLabel =
      live?.state === 'publishing'
        ? 'Publishing…'
        : live?.state === 'success'
          ? 'Success'
          : live?.state === 'failed'
            ? 'Failed'
            : board.publishedStatus === 'not_published'
              ? 'Not published'
              : board.publishedStatus;

    const statusTone =
      live?.state === 'publishing'
        ? 'pending'
        : live?.state === 'success'
          ? 'success'
          : live?.state === 'failed'
            ? 'failed'
            : board.publishedStatus === 'published'
              ? 'published'
              : board.publishedStatus === 'failed'
                ? 'failed'
                : 'draft';

    return (
      <button
        key={board.name}
        type="button"
        disabled={publishing}
        onClick={() => toggle(board.name)}
        className={`rounded-2xl border p-4 text-left transition ${
          checked
            ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-500/20'
            : 'border-ink-200 bg-white hover:border-ink-300'
        } ${publishing ? 'cursor-wait opacity-90' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
              <Globe2 className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-semibold text-ink-900">{board.name}</p>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  DEMO
                </span>
              </div>
              <p className="text-xs text-ink-500">
                {board.region} · {board.type} · Mock adapter
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BoardStatusIcon state={live?.state} />
            <input
              type="checkbox"
              readOnly
              checked={checked}
              className="accent-brand-600"
              tabIndex={-1}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge status={board.connectionStatus}>
            {String(board.connectionStatus).replace('_', ' ')}
          </Badge>
          <Badge status={statusTone}>{statusLabel}</Badge>
        </div>

        {(live?.externalJobId || board.externalJobId) && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-ink-50 px-2.5 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                External job ID
              </p>
              <p className="truncate font-mono text-xs text-ink-700">
                {live?.externalJobId || board.externalJobId}
              </p>
            </div>
            <button
              type="button"
              className="rounded p-1 text-ink-400 hover:bg-white hover:text-ink-700"
              onClick={(e) => {
                e.stopPropagation();
                copyId(live?.externalJobId || board.externalJobId);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {live?.message && live.state !== 'queued' && (
          <p className="mt-2 text-xs text-ink-500">{live.message}</p>
        )}
        {!live && board.errorMessage && (
          <p className="mt-2 text-xs text-rose-600">{board.errorMessage}</p>
        )}
        {!live && board.publishedAt && (
          <p className="mt-1 text-xs text-ink-400">
            Published {formatDateTime(board.publishedAt)}
            {board.durationMs != null ? ` · ${board.durationMs} ms` : ''}
          </p>
        )}
      </button>
    );
  };

  return (
    <div>
      <Link
        to={`/app/jobs/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to job
      </Link>

      <PageHeader
        title="Job distribution"
        description={`Publish “${job.title}” to multiple boards through DEMO mock adapters. No real job board APIs are called.`}
        actions={
          <Button onClick={publish} loading={publishing} disabled={!selected.length || publishing}>
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              `Publish to selected (${selected.length})`
            )}
          </Button>
        }
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">DEMO / MOCK integrations only</p>
          <p className="mt-0.5 text-amber-900/90">
            Indeed, LinkedIn, Monster, JobStreet, Kalibrr, OnlineJobs.ph, JobsDB, and PhilJobNet
            use mock adapters. Responses simulate latency and generate demo external job IDs —
            they are not live API integrations.
          </p>
        </div>
      </div>

      {publishing && (
        <Card className="mb-4">
          <CardBody>
            <p className="text-sm font-semibold text-ink-900">Publishing progress</p>
            <ProgressBar current={progress.current} total={progress.total} />
            <ul className="mt-4 space-y-2">
              {selected.map((name) => {
                const p = boardProgress[name];
                return (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 font-medium text-ink-800">
                      <BoardStatusIcon state={p?.state} />
                      {name}
                      <span className="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                        DEMO
                      </span>
                    </span>
                    <span className="text-xs text-ink-500">
                      {p?.state === 'queued' && 'Waiting'}
                      {p?.state === 'publishing' && 'In progress…'}
                      {p?.state === 'success' && 'Success'}
                      {p?.state === 'failed' && 'Failed'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="mr-2 text-sm font-semibold text-ink-800">Primary demo boards</p>
        <Button size="sm" variant="secondary" onClick={selectPrimary} disabled={publishing}>
          Select all 8
        </Button>
        <Button size="sm" variant="ghost" onClick={clearSelection} disabled={publishing}>
          Clear
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {primaryBoards.map(renderBoardCard)}
      </div>

      {otherBoards.length > 0 && (
        <>
          <p className="mb-3 mt-8 text-sm font-semibold text-ink-800">
            Additional catalog boards (also DEMO)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {otherBoards.map(renderBoardCard)}
          </div>
        </>
      )}

      {sessionResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="This session — publish results"
            subtitle="Generated by mock adapters in this browser session"
          />
          <CardBody className="space-y-2 p-0">
            {sessionResults.map((r) => (
              <div
                key={`${r.board}-${r.externalJobId || r.message}`}
                className="flex flex-col gap-2 border-t border-ink-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-900">{r.board}</p>
                    <Badge status={r.success ? 'success' : 'failed'}>
                      {r.success ? 'Success' : 'Failure'}
                    </Badge>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      DEMO
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{r.message}</p>
                  {r.externalJobId && (
                    <p className="mt-1 font-mono text-xs text-ink-700">
                      External ID: {r.externalJobId}
                    </p>
                  )}
                </div>
                <p className="text-xs text-ink-400">
                  {r.durationMs != null ? `${r.durationMs} ms` : ''}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader
          title="Publishing history"
          subtitle="Past DEMO publish and close events for this job"
        />
        <CardBody className="p-0">
          {history.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-500">
              No publish history yet. Select boards and click Publish to selected.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Board</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">External job ID</th>
                    <th className="px-4 py-3">Response</th>
                    <th className="px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-ink-50 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                        {formatDateTime(row.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-900">
                        {row.board || '—'}
                        <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                          DEMO
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.action}</td>
                      <td className="px-4 py-3">
                        <Badge status={row.status}>{row.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">
                        {row.externalJobId || '—'}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-xs text-ink-600">
                        {row.response || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-500">
                        {row.durationMs != null ? `${row.durationMs} ms` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
