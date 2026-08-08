import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Settings,
  Users,
  UserCircle2,
  X,
  Building2,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/helpers';
import Button from '../components/ui/Button';
import { DemoBadge } from '../components/ui/Badge';

const recruiterNav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/app/candidates', label: 'Candidates', icon: Users },
  { to: '/app/integrations', label: 'Integrations', icon: Plug },
  { to: '/app/activity', label: 'Activity', icon: Activity },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: UserCircle2 },
  { to: '/admin/recruiters', label: 'Recruiters', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/candidates', label: 'Candidates', icon: Users },
  { to: '/admin/boards', label: 'Job boards', icon: Plug },
  { to: '/admin/logs', label: 'Integration logs', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function BrandMark({ to, subtitle }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-900/20">
        <Briefcase className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[15px] font-bold tracking-tight text-ink-900">
          HireSync
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

export default function DashboardLayout({ variant = 'recruiter' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = variant === 'admin' ? adminNav : recruiterNav;
  const brandPath = variant === 'admin' ? '/admin' : '/app';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavItems = ({ onNavigate }) => (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-brand-50 text-brand-800 shadow-sm shadow-brand-900/5'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const UserFooter = () => (
    <div className="border-t border-ink-100 p-4">
      <div className="mb-3 rounded-xl border border-ink-100 bg-ink-50/80 px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
        <p className="truncate text-xs text-ink-500">{user?.email}</p>
        {user?.company && (
          <p className="mt-0.5 truncate text-xs text-ink-400">{user.company}</p>
        )}
      </div>
      <Button variant="secondary" className="w-full" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-ink-200/80 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-ink-100 px-5">
          <BrandMark
            to={brandPath}
            subtitle={variant === 'admin' ? 'Admin' : 'Recruiter'}
          />
        </div>
        <NavItems />
        <UserFooter />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <BrandMark
                to={brandPath}
                subtitle={variant === 'admin' ? 'Admin' : 'Recruiter'}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <UserFooter />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-ink-600 hover:bg-ink-50 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 sm:hidden">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Workspace
              </p>
              <p className="truncate text-sm font-semibold text-ink-900">
                {user?.company || user?.name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <DemoBadge />
            <Link
              to="/"
              className="hidden text-sm font-medium text-ink-500 transition hover:text-ink-800 md:inline"
            >
              Marketing site
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="page-stack">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
