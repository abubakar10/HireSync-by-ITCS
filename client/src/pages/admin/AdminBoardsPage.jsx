import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plug, Play, Users } from 'lucide-react';
import { activityApi, integrationsApi } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';
import SimulateApplicationModal from '../../components/SimulateApplicationModal';

export default function AdminBoardsPage() {
  const toast = useToast();
  const [integrations, setIntegrations] = useState([]);
  const [recentSyncs, setRecentSyncs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [intRes, logRes] = await Promise.all([
        integrationsApi.list(),
        activityApi.integrationLogs({ action: 'Application Sync', limit: 8 }),
      ]);
      setIntegrations(intRes.data.data.integrations);
      setRecentSyncs(logRes.data.data.logs || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (item) => {
    try {
      await integrationsApi.update(item._id, { enabled: !item.enabled });
      toast.success(`${item.name} ${item.enabled ? 'disabled' : 'enabled'} (demo)`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Job boards"
        description="Manage DEMO board connections and simulate inbound applications into the candidate pipeline."
        actions={
          <Button onClick={() => setSimulateOpen(true)}>
            <Play className="h-4 w-4" />
            Simulate Application
          </Button>
        }
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Inbound candidate flow (DEMO)</p>
        <p className="mt-1 text-amber-900/90">
          1) Publish a job to a board → 2) Simulate Application → 3) Candidate appears in pipeline under{' '}
          <strong>New</strong> with the board as source. No real job board credentials required.
        </p>
      </div>

      {lastResult && (
        <Card className="mb-4 border-brand-200">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">{lastResult.message}</p>
              <p className="mt-1 text-sm text-ink-600">
                {lastResult.candidate?.name} · Source{' '}
                <Badge>{lastResult.candidate?.source}</Badge> · Column{' '}
                <Badge status="New">New</Badge>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/app/candidates">
                <Button size="sm">
                  <Users className="h-4 w-4" />
                  View pipeline
                </Button>
              </Link>
              <Link to="/admin/candidates">
                <Button size="sm" variant="secondary">
                  Admin candidates
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item) => (
          <Card key={item._id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100">
                    <Plug className="h-5 w-5 text-ink-700" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-ink-900">{item.name}</p>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        DEMO
                      </span>
                    </div>
                    <p className="text-xs text-ink-500">
                      {item.type} · {item.region}
                    </p>
                  </div>
                </div>
                <Badge status={item.status}>{String(item.status).replace('_', ' ')}</Badge>
              </div>
              <p className="mt-3 text-xs text-ink-500">
                Last sync {formatDateTime(item.lastSyncAt)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  variant="secondary"
                  onClick={() => toggle(item)}
                >
                  {item.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSimulateOpen(true)}
                >
                  Simulate
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Recent application syncs"
          subtitle="Inbound webhook / simulate events (DEMO)"
          action={
            <Link to="/admin/logs" className="text-sm font-semibold text-brand-700">
              All logs
            </Link>
          }
        />
        <CardBody className="divide-y divide-ink-100 p-0">
          {recentSyncs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-500">
              No application syncs yet. Use Simulate Application to create the first inbound candidate.
            </p>
          ) : (
            recentSyncs.map((log) => (
              <div
                key={log._id}
                className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {log.details?.name || 'Applicant'} → {log.details?.jobTitle || 'Job'}
                  </p>
                  <p className="text-xs text-ink-500">
                    Source {log.board || '—'} · {log.response}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={log.status}>{log.status}</Badge>
                  <span className="text-xs text-ink-400">{formatDateTime(log.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <SimulateApplicationModal
        open={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        onSuccess={(data) => {
          setLastResult(data);
          load();
        }}
      />
    </div>
  );
}
