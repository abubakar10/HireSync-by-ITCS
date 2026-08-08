import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from './ui/Skeleton';

export function ProtectedRoute({ roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <PageSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : '/app';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    const to = user.role === 'admin' ? '/admin' : user.role === 'recruiter' ? '/app' : '/jobs';
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}
