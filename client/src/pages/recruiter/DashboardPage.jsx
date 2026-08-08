import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Send,
  CalendarDays,
  Plus,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { jobsApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader, StatCard } from '../../components/PageHeader';
import Button from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { PageSkeleton } from '../../components/ui/Skeleton';

const PIE_COLORS = ['#2d8f68', '#4aa882', '#8592a8', '#f59e0b', '#e11d48', '#0ea5e9'];

export default function RecruiterDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    jobsApi
      .dashboardStats()
      .then((res) => {
        if (!cancelled) setData(res.data.data);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  const { stats, charts } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Track openings, inbound applications, and channel performance."
        actions={
          <Link to="/app/jobs/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create job
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total jobs" value={stats.totalJobs} icon={Briefcase} />
        <StatCard label="Active jobs" value={stats.activeJobs} hint="Published" icon={Send} />
        <StatCard label="Total candidates" value={stats.totalCandidates} icon={Users} />
        <StatCard
          label="Candidates this month"
          value={stats.candidatesThisMonth}
          icon={CalendarDays}
        />
        <StatCard label="Jobs published" value={stats.jobsPublished} icon={Briefcase} />
        <StatCard label="Applications today" value={stats.applicationsToday} icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Applications over time" subtitle="Last 30 days" />
          <CardBody className="h-72">
            {charts.applicationsOverTime?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.applicationsOverTime}>
                  <defs>
                    <linearGradient id="appFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2d8f68" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2d8f68" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#1f7252"
                    fill="url(#appFill)"
                    name="Applications"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-500">No applications in the last 30 days yet.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Candidates by source" />
          <CardBody className="h-72">
            {charts.candidatesBySource?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.candidatesBySource}
                    dataKey="count"
                    nameKey="source"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {charts.candidatesBySource.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-ink-500">No source data yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Jobs by status" />
        <CardBody className="h-64">
          {charts.jobsByStatus?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.jobsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2d8f68" radius={[6, 6, 0, 0]} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-500">Create your first job to see status breakdown.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
