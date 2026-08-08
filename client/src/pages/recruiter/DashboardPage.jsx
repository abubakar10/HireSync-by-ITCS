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
  Legend,
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
import SourceBadge, { sourceChartColor } from '../../components/ui/SourceBadge';
import { PageSkeleton } from '../../components/ui/Skeleton';

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
  const bySource = charts.candidatesBySource || [];
  const totalFromSources = bySource.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Track openings, inbound applications, and channel performance by source."
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

      {bySource.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Candidates by source"
            subtitle="Application channel breakdown from your candidate records"
            action={
              <Link
                to="/app/candidates"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View pipeline
              </Link>
            }
          />
          <CardBody className="pt-2">
            <div className="flex flex-wrap gap-2">
              {bySource.map((row) => (
                <Link
                  key={row.source}
                  to={`/app/candidates?source=${encodeURIComponent(row.source)}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/80 px-3 py-2 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <SourceBadge source={row.source} />
                  <span className="font-display text-base font-bold text-ink-900">
                    {row.count}
                  </span>
                  <span className="text-xs text-ink-400">
                    {Math.round((row.count / totalFromSources) * 100)}%
                  </span>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

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
              <p className="flex h-full items-center text-sm text-ink-500">
                No applications in the last 30 days yet.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Source mix" subtitle="Share of applicants" />
          <CardBody className="h-72">
            {bySource.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bySource}
                    dataKey="count"
                    nameKey="source"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {bySource.map((row, i) => (
                      <Cell key={row.source} fill={sourceChartColor(row.source, i)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} candidates`, name]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center text-sm text-ink-500">
                No source data yet. Publish jobs and sync applications to see channels.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Candidates by source" subtitle="Count per application channel" />
        <CardBody className="h-72">
          {bySource.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySource} margin={{ left: 4, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} candidates`, 'Count']} />
                <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]}>
                  {bySource.map((row, i) => (
                    <Cell key={row.source} fill={sourceChartColor(row.source, i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center text-sm text-ink-500">
              Source counts appear once candidates are in the database.
            </p>
          )}
        </CardBody>
      </Card>

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
            <p className="flex h-full items-center text-sm text-ink-500">
              Create your first job to see status breakdown.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
