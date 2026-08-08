import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Globe2,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
  Clock3,
  AlertCircle,
} from 'lucide-react';
import { distributionApi } from '../../services/api';
import { formatDateTime, getErrorMessage, cn } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge, { DemoBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { PageSkeleton } from '../../components/ui/Skeleton';

function labelStatus(value) {
  if (!value) return '—';
  return String(value).replaceAll('_', ' ');
}

function publishTone(liveState, publishedStatus) {
  if (liveState === 'publishing' || liveState === 'queued') return 'pending';
  if (liveState === 'success') return 'success';
  if (liveState === 'failed') return 'failed';
  if (publishedStatus === 'published' || publishedStatus === 'updated') return 'published';
  if (publishedStatus === 'failed') return 'failed';
  if (publishedStatus === 'closed') return 'closed';
  if (publishedStatus === 'pending') return 'pending';
  return 'draft';
}

function publishLabel(liveState, publishedStatus) {
  if (liveState === 'queued') return 'Queued';
  if (liveState === 'publishing') return 'Publishing…';
  if (liveState === 'success') return 'Published (this session)';
  if (liveState === 'failed') return 'Failed (this session)';
  if (publishedStatus === 'not_published') return 'Not published';
  return labelStatus(publishedStatus);
}

function ProgressBar({ current, total }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-500">
        <span>
          Publishing {current} of {total} boards · DEMO mock adapters
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BoardStatusIcon({ state }) {
  if (state === 'publishing' || state === 'queued') {
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

function MetaRow({ label, children }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-xs sm:grid-cols-[8.5rem_1fr]">
      <dt className="font-medium text-ink-400">{label}</dt>
      <dd className="min-w-0 text-ink-700">{children}</dd>
    </div>
  );
}

function BoardCard({
  board,
  checked,
  live,
  publishing,
  onToggle,
  onCopy,
  onRetryOne,
}) {
  const extId = live?.externalJobId || board.externalJobId;
  const errorMsg =
    live?.state === 'failed'
      ? live.message
      : !live || live.state === 'queued'
        ? board.errorMessage
        : live?.state === 'success'
          ? null
          : board.errorMessage;
  const lastSync = board.lastSyncedAt;
  const isFailed =
    live?.state === 'failed' || (!live && board.publishedStatus === 'failed');

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(28,34,44,0.04)] transition',
        checked
          ? 'border-brand-400 ring-2 ring-brand-500/15'
          : 'border-ink-200/80 hover:border-ink-300',
        publishing && 'opacity-95'
      )}
    >
      <div className="flex items-start gap-3">
        <label className="mt-1 flex cursor-pointer items-start">
          <input
            type="checkbox"
            checked={checked}
            disabled={publishing}
            onChange={() => onToggle(board.name)}
            className="mt-0.5 h-4 w-4 accent-brand-600"
            aria-label={`Select ${board.name}`}
          />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Globe2 className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-ink-900">
                    {board.name}
                  </h3>
                  <DemoBadge />
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  Mock adapter · not a live API
                </p>
              </div>
            </div>
            <BoardStatusIcon state={live?.state} />
          </div>

          <dl className="mt-4 space-y-2 border-t border-ink-50 pt-3">
            <MetaRow label="Region">{board.region || '—'}</MetaRow>
            <MetaRow label="Integration type">{board.type || '—'}</MetaRow>
            <MetaRow label="Connection">
              <Badge status={board.connectionStatus}>
                {labelStatus(board.connectionStatus)}
              </Badge>
              {!board.enabled && (
                <span className="ml-1.5 text-ink-400">(disabled)</span>
              )}
            </MetaRow>
            <MetaRow label="Publishing">
              <Badge status={publishTone(live?.state, board.publishedStatus)}>
                {publishLabel(live?.state, board.publishedStatus)}
              </Badge>
            </MetaRow>
            <MetaRow label="External job ID">
              {extId ? (
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <code className="truncate rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-800">
                    {extId}
                  </code>
                  <button
                    type="button"
                    className="rounded p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                    onClick={() => onCopy(extId)}
                    aria-label="Copy external job ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-ink-400">Not assigned yet</span>
              )}
            </MetaRow>
            <MetaRow label="Last sync">
              {lastSync ? (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-ink-400" />
                  {formatDateTime(lastSync)}
                </span>
              ) : (
                <span className="text-ink-400">Never</span>
              )}
            </MetaRow>
          </dl>

          {errorMsg && (
            <div className="mt-3 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="mt-0.5 leading-relaxed opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {live?.message && live.state === 'success' && (
            <p className="mt-3 text-xs leading-relaxed text-brand-800">{live.message}</p>
          )}

          {isFailed && !publishing && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onRetryOne(board.name)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry publish
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
      const { data } = await distributionApi.history(id, { limit: 50 });
      setHistory(data.data.history || []);
    } catch {
      // non-blocking
    }
  }, [id]);

  const load = useCallback(
    async ({ preserveSelection = true } = {}) => {
      setLoading(true);
      try {
        const { data } = await distributionApi.forJob(id);
        setPayload(data.data);
        const primaryNames = data.data.primaryBoards || [];
        const preselect = data.data.boards
          .filter(
            (b) =>
              primaryNames.includes(b.name) && b.publishedStatus !== 'published'
          )
          .map((b) => b.name);
        setSelected((prev) => {
          if (preserveSelection && prev.length) {
            return prev.filter((name) =>
              data.data.boards.some((b) => b.name === name)
            );
          }
          return preselect;
        });
        await loadHistory();
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [id, loadHistory, toast]
  );

  useEffect(() => {
    load({ preserveSelection: false });
  }, [id]);

  const primaryBoards = useMemo(() => {
    if (!payload) return [];
    return payload.boards.filter((b) => b.primary);
  }, [payload]);

  const otherBoards = useMemo(() => {
    if (!payload) return [];
    return payload.boards.filter((b) => !b.primary);
  }, [payload]);

  const summary = useMemo(() => {
    if (!payload) return { published: 0, failed: 0, pending: 0, total: 0 };
    const boards = payload.boards;
    return {
      total: boards.length,
      published: boards.filter((b) =>
        ['published', 'updated'].includes(b.publishedStatus)
      ).length,
      failed: boards.filter((b) => b.publishedStatus === 'failed').length,
      pending: boards.filter((b) =>
        ['not_published', 'pending'].includes(b.publishedStatus)
      ).length,
    };
  }, [payload]);

  const failedBoardNames = useMemo(() => {
    if (!payload) return [];
    const fromSession = Object.entries(boardProgress)
      .filter(([, v]) => v.state === 'failed')
      .map(([name]) => name);
    const fromDb = payload.boards
      .filter((b) => b.publishedStatus === 'failed')
      .map((b) => b.name);
    return [...new Set([...fromSession, ...fromDb])];
  }, [payload, boardProgress]);

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

  const selectAll = () => {
    if (publishing || !payload) return;
    setSelected(payload.boards.map((b) => b.name));
  };

  const clearSelection = () => {
    if (publishing) return;
    setSelected([]);
  };

  const selectFailed = () => {
    if (publishing) return;
    setSelected(failedBoardNames);
  };

  const copyId = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('External job ID copied');
    } catch {
      toast.info(value);
    }
  };

  const publishBoards = async (boardNames) => {
    if (!boardNames.length) {
      toast.info('Select at least one board');
      return;
    }

    setPublishing(true);
    setSessionResults([]);
    setProgress({ current: 0, total: boardNames.length });

    const initial = {};
    boardNames.forEach((name) => {
      initial[name] = {
        state: 'queued',
        message: 'Queued for DEMO mock publish',
        externalJobId: null,
      };
    });
    setBoardProgress(initial);

    const results = [];

    for (let i = 0; i < boardNames.length; i++) {
      const board = boardNames[i];
      setBoardProgress((prev) => ({
        ...prev,
        [board]: {
          state: 'publishing',
          message: 'Publishing via DEMO mock adapter…',
          externalJobId: null,
        },
      }));
      setProgress({ current: i, total: boardNames.length });

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

      setProgress({ current: i + 1, total: boardNames.length });
      setSessionResults([...results]);
    }

    const ok = results.filter((r) => r.success).length;
    const failed = results.length - ok;
    if (failed === 0) {
      toast.success(
        `[DEMO] All ${ok} boards published via mock adapters — no live APIs called`
      );
    } else {
      toast.info(
        `[DEMO] Finished: ${ok} succeeded, ${failed} failed (mock adapters only)`
      );
    }
    setPublishing(false);
    await load({ preserveSelection: true });
  };

  const publish = () => publishBoards(selected);

  const retryFailed = () => {
    if (!failedBoardNames.length) {
      toast.info('No failed boards to retry');
      return;
    }
    setSelected(failedBoardNames);
    publishBoards(failedBoardNames);
  };

  const retryOne = (name) => {
    setSelected([name]);
    publishBoards([name]);
  };

  if (loading && !payload) return <PageSkeleton />;
  if (!payload) return null;

  const { job } = payload;
  const sessionFailed = sessionResults.filter((r) => !r.success);
  const sessionOk = sessionResults.filter((r) => r.success);

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
        description={`Distribute “${job.title}” across job boards using DEMO mock adapters.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={publishing}
              onClick={() => load({ preserveSelection: true })}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {failedBoardNames.length > 0 && (
              <Button
                variant="secondary"
                onClick={retryFailed}
                disabled={publishing}
              >
                <RotateCcw className="h-4 w-4" />
                Retry failed ({failedBoardNames.length})
              </Button>
            )}
            <Button
              onClick={publish}
              loading={publishing}
              disabled={!selected.length || publishing}
            >
              {publishing
                ? 'Publishing…'
                : `Publish to selected (${selected.length})`}
            </Button>
          </div>
        }
      />

      <Alert tone="warning" title="DEMO / MOCK integrations only" className="mb-5">
        Every board on this page uses a mock adapter. HireSync simulates latency and demo
        external job IDs for client demos — <strong>no real job board APIs are connected or
        called</strong>.
      </Alert>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Boards in catalog', value: summary.total },
          { label: 'Published', value: summary.published, tone: 'text-brand-700' },
          { label: 'Failed', value: summary.failed, tone: 'text-rose-700' },
          { label: 'Selected', value: selected.length, tone: 'text-ink-900' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-ink-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(28,34,44,0.04)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              {stat.label}
            </p>
            <p
              className={cn(
                'mt-1 font-display text-2xl font-bold tracking-tight',
                stat.tone || 'text-ink-900'
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {(publishing || sessionResults.length > 0) && (
        <Card className="mb-5">
          <CardHeader
            title="Publishing progress"
            subtitle="One board at a time through DEMO mock adapters"
            action={<DemoBadge />}
          />
          <CardBody className="space-y-4">
            {publishing && (
              <ProgressBar current={progress.current} total={progress.total} />
            )}
            {!publishing && sessionResults.length > 0 && (
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium text-brand-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {sessionOk.length} succeeded
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                  <XCircle className="h-4 w-4" />
                  {sessionFailed.length} failed
                </span>
              </div>
            )}
            <ul className="space-y-2">
              {(publishing
                ? selected
                : sessionResults.map((r) => r.board)
              ).map((name) => {
                const p = boardProgress[name];
                const result = sessionResults.find((r) => r.board === name);
                return (
                  <li
                    key={name}
                    className="flex flex-col gap-1 rounded-xl border border-ink-100 bg-ink-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                      <BoardStatusIcon state={p?.state} />
                      {name}
                      <DemoBadge />
                    </span>
                    <span className="text-xs text-ink-500 sm:text-right">
                      {p?.state === 'queued' && 'Waiting in queue'}
                      {p?.state === 'publishing' && 'Mock publish in progress…'}
                      {p?.state === 'success' &&
                        `Success${result?.externalJobId ? ` · ${result.externalJobId}` : ''}`}
                      {p?.state === 'failed' && (p.message || 'Failed')}
                    </span>
                  </li>
                );
              })}
            </ul>
            {!publishing && sessionFailed.length > 0 && (
              <Button size="sm" variant="secondary" onClick={retryFailed}>
                <RotateCcw className="h-3.5 w-3.5" />
                Retry {sessionFailed.length} failed board
                {sessionFailed.length === 1 ? '' : 's'}
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm font-semibold text-ink-800">Board selection</p>
        <Button size="sm" variant="secondary" onClick={selectPrimary} disabled={publishing}>
          Select primary ({primaryBoards.length})
        </Button>
        <Button size="sm" variant="secondary" onClick={selectAll} disabled={publishing}>
          Select all
        </Button>
        {failedBoardNames.length > 0 && (
          <Button size="sm" variant="secondary" onClick={selectFailed} disabled={publishing}>
            Select failed
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={clearSelection} disabled={publishing}>
          Clear
        </Button>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Primary demo boards
        </h2>
        <DemoBadge />
      </div>
      <p className="mb-4 text-sm text-ink-500">
        Core channels for this demo. Each card shows connection and publish status from HireSync —
        not live board dashboards.
      </p>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {primaryBoards.map((board) => (
          <BoardCard
            key={board.name}
            board={board}
            checked={selected.includes(board.name)}
            live={boardProgress[board.name]}
            publishing={publishing}
            onToggle={toggle}
            onCopy={copyId}
            onRetryOne={retryOne}
          />
        ))}
      </div>

      {otherBoards.length > 0 && (
        <>
          <div className="mb-2 mt-10 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Additional catalog boards
            </h2>
            <DemoBadge />
          </div>
          <p className="mb-4 text-sm text-ink-500">
            Same mock architecture as primary boards — still DEMO only.
          </p>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {otherBoards.map((board) => (
              <BoardCard
                key={board.name}
                board={board}
                checked={selected.includes(board.name)}
                live={boardProgress[board.name]}
                publishing={publishing}
                onToggle={toggle}
                onCopy={copyId}
                onRetryOne={retryOne}
              />
            ))}
          </div>
        </>
      )}

      {sessionResults.length > 0 && (
        <Card className="mt-8">
          <CardHeader
            title="This session — publish results"
            subtitle="Outcomes from mock adapters in your current browser session"
            action={<DemoBadge />}
          />
          <CardBody className="space-y-0 p-0">
            {sessionResults.map((r) => (
              <div
                key={`${r.board}-${r.externalJobId || r.message}-${r.durationMs}`}
                className="flex flex-col gap-2 border-t border-ink-100 px-5 py-3.5 first:border-t-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink-900">{r.board}</p>
                    <Badge status={r.success ? 'success' : 'failed'}>
                      {r.success ? 'Success' : 'Failure'}
                    </Badge>
                    <DemoBadge />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{r.message}</p>
                  {r.externalJobId && (
                    <p className="mt-1.5 font-mono text-xs text-ink-700">
                      External ID: {r.externalJobId}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-xs text-ink-400">
                    {r.durationMs != null ? `${r.durationMs} ms` : ''}
                  </p>
                  {!r.success && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={publishing}
                      onClick={() => retryOne(r.board)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader
          title="Distribution history"
          subtitle="Past DEMO publish and close events for this job"
          action={<DemoBadge />}
        />
        <CardBody className="p-0">
          {history.length === 0 ? (
            <EmptyState
              title="No distribution history yet"
              description="Select boards above and publish to generate demo history with external job IDs."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Board</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>External job ID</th>
                    <th>Response</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="whitespace-nowrap text-ink-500">
                        {formatDateTime(row.timestamp)}
                      </td>
                      <td>
                        <span className="inline-flex flex-wrap items-center gap-1.5 font-medium text-ink-900">
                          {row.board || '—'}
                          <DemoBadge />
                        </span>
                      </td>
                      <td>{row.action}</td>
                      <td>
                        <Badge status={row.status}>{row.status}</Badge>
                      </td>
                      <td className="font-mono text-xs text-ink-700">
                        {row.externalJobId || '—'}
                      </td>
                      <td className="max-w-xs text-xs leading-relaxed text-ink-600">
                        {row.response || '—'}
                      </td>
                      <td className="text-ink-500">
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

      {selected.length > 0 && !publishing && (
        <div className="sticky bottom-4 z-20 mt-8">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white/95 px-4 py-3 shadow-lg shadow-ink-900/10 backdrop-blur">
            <p className="text-sm text-ink-600">
              <span className="font-semibold text-ink-900">{selected.length}</span> board
              {selected.length === 1 ? '' : 's'} selected ·{' '}
              <span className="font-medium text-amber-800">DEMO mock publish</span>
            </p>
            <Button onClick={publish}>Publish to selected ({selected.length})</Button>
          </div>
        </div>
      )}
    </div>
  );
}
