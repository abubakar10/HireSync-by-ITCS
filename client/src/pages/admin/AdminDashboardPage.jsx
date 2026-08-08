import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Briefcase, Plug, Users, Play } from 'lucide-react';
import { integrationsApi } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader, StatCard } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';
import SimulateApplicationModal from '../../components/SimulateApplicationModal';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulateOpen, setSimulateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    integrationsApi
      .adminStats()
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  const { stats, recentActivity } = data;

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        description="Platform-wide recruiting activity, board health, and sync quality."
        actions={
          <Button onClick={() => setSimulateOpen(true)}>
            <Play className="h-4 w-4" />
            Simulate Application
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total recruiters" value={stats.totalRecruiters} icon={Building2} />
        <StatCard label="Total jobs" value={stats.totalJobs} icon={Briefcase} />
        <StatCard label="Total candidates" value={stats.totalCandidates} icon={Users} />
        <StatCard label="Connected boards" value={stats.connectedBoards} icon={Plug} />
        <StatCard
          label="Publishing success rate"
          value={`${stats.publishingSuccessRate}%`}
          hint="Demo publish events"
        />
        <StatCard
          label="Application sync count"
          value={stats.applicationSyncCount}
          hint="Successful inbound syncs"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Recent activity"
          action={
            <Link to="/admin/logs" className="text-sm font-semibold text-brand-700">
              View logs
            </Link>
          }
        />
        <CardBody className="divide-y divide-ink-100 p-0">
          {(recentActivity || []).length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-500">
              No recent activity yet. Publishing jobs or simulating applications will appear here.
            </p>
          ) : (
            (recentActivity || []).map((item) => (
              <div
                key={item._id}
                className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{item.action}</p>
                  <p className="text-xs text-ink-500">
                    {item.userId?.name || 'System'}
                    {item.board ? ` · ${item.board}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={item.status}>{item.status}</Badge>
                  <span className="text-xs text-ink-400">{formatDateTime(item.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <SimulateApplicationModal
        open={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        onSuccess={() => load()}
      />
    </div>
  );
}
