import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function SettingsPage({ admin = false }) {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={admin ? 'System settings' : 'Settings'}
        description={
          admin
            ? 'Workspace configuration for this HireSync demo environment.'
            : 'Your recruiter profile and workspace preferences.'
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Name</span>
              <span className="font-medium text-ink-900">{user?.name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Email</span>
              <span className="font-medium text-ink-900">{user?.email}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Role</span>
              <Badge>{user?.role}</Badge>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-500">Company</span>
              <span className="font-medium text-ink-900">{user?.company || '—'}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Demo environment" />
          <CardBody className="space-y-3 text-sm text-ink-600">
            <p>
              Job board integrations run in <strong className="text-ink-900">demo/mock mode</strong>.
              External IDs are generated locally and no third-party credentials are stored in the
              frontend.
            </p>
            <p>
              To connect a real board later, replace the adapter under{' '}
              <code className="rounded bg-ink-100 px-1 text-xs">server/src/integrations/</code> and
              keep API secrets in server environment variables only.
            </p>
            {admin && (
              <p>
                Seed data includes 1 admin, 3 recruiters, 10 jobs, 30 candidates, distribution
                records, and activity logs. Re-run <code className="rounded bg-ink-100 px-1 text-xs">npm run seed</code> to reset.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
