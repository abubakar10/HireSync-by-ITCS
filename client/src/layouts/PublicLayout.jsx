import { Link, NavLink, Outlet } from 'react-router-dom';
import { Briefcase, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const appHome =
    user?.role === 'admin' ? '/admin' : user?.role === 'recruiter' ? '/app' : '/jobs';

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-900/20">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              HireSync
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                isActive ? 'text-brand-700' : 'transition hover:text-ink-900'
              }
            >
              Browse jobs
            </NavLink>
            <a href="/#how-it-works" className="transition hover:text-ink-900">
              How it works
            </a>
            <a href="/#integrations" className="transition hover:text-ink-900">
              Integrations
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => logout()}>
                  Log out
                </Button>
                <Link to={appHome}>
                  <Button size="sm">Open app</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} HireSync</p>
          <p className="text-xs text-ink-400">
            Job board connections are mocked until real API credentials are added.
          </p>
        </div>
      </footer>
    </div>
  );
}
