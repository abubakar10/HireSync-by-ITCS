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

const recruiterNav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/app/candidates', label: 'Candidates', icon: Users },
  { to: '/app/integrations', label: 'Integrations', icon: Plug },
  { to: '/app/activity', label: 'Activity Logs', icon: Activity },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: UserCircle2 },
  { to: '/admin/recruiters', label: 'Recruiters', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/candidates', label: 'Candidates', icon: Users },
  { to: '/admin/boards', label: 'Job Boards', icon: Plug },
  { to: '/admin/logs', label: 'Integration Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'System Settings', icon: Settings },
];

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
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
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
                ? 'bg-brand-50 text-brand-800'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
            )
          }
        >
          <item.icon className="h-4.5 w-4.5 h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-5">
          <Link to={brandPath} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-ink-900">HireSync</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                {variant === 'admin' ? 'Admin' : 'Recruiter'}
              </p>
            </div>
          </Link>
        </div>
        <NavItems />
        <div className="border-t border-ink-100 p-4">
          <div className="mb-3 rounded-xl bg-ink-50 px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <Button variant="secondary" className="w-full" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <span className="font-display font-bold text-ink-900">HireSync</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-ink-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="border-t border-ink-100 p-4">
              <Button variant="secondary" className="w-full" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-50 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm text-ink-500">Signed in as</p>
              <p className="text-sm font-semibold text-ink-900">
                {user?.name}
                {user?.company ? ` · ${user.company}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              Demo mode
            </span>
            <Link to="/" className="hidden text-sm font-medium text-ink-500 hover:text-ink-800 sm:inline">
              Marketing site
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
