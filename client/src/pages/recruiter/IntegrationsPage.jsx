import { useEffect, useState } from 'react';
import { Plug, Play } from 'lucide-react';
import { integrationsApi } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';
import SimulateApplicationModal from '../../components/SimulateApplicationModal';

export default function IntegrationsPage() {
  const toast = useToast();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [simulateOpen, setSimulateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await integrationsApi.list();
      setIntegrations(data.data.integrations);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const test = async (id) => {
    setTestingId(id);
    try {
      const { data } = await integrationsApi.test(id);
      toast.success(data.message || 'Connection test completed (demo)');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTestingId(null);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Job board adapters with demo connection status. Simulate inbound applications without real credentials."
        actions={
          <Button onClick={() => setSimulateOpen(true)}>
            <Play className="h-4 w-4" />
            Simulate Application
          </Button>
        }
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        All integrations are Demo / Mock. Inbound sync uses{' '}
        <code className="rounded bg-white px-1">POST /api/integrations/:board/applications</code>.
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item) => (
          <Card key={item._id}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Plug className="h-5 w-5" />
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
              <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                <span>{item.enabled ? 'Enabled' : 'Disabled'}</span>
                <span>Last sync {formatDateTime(item.lastSyncAt)}</span>
              </div>
              <Button
                className="mt-4 w-full"
                variant="secondary"
                size="sm"
                loading={testingId === item._id}
                onClick={() => test(item._id)}
              >
                Test connection
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <SimulateApplicationModal
        open={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        onSuccess={() => load()}
      />
    </div>
  );
}
