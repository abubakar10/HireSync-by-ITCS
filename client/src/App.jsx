import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GuestOnly, ProtectedRoute } from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import PublicJobsPage from './pages/public/PublicJobsPage';
import PublicJobDetailPage from './pages/public/PublicJobDetailPage';
import ApplyPage from './pages/public/ApplyPage';

import RecruiterDashboard from './pages/recruiter/DashboardPage';
import JobsPage from './pages/recruiter/JobsPage';
import CreateJobPage from './pages/recruiter/CreateJobPage';
import JobDetailPage from './pages/recruiter/JobDetailPage';
import JobDistributionPage from './pages/recruiter/JobDistributionPage';
import CandidatesPage from './pages/recruiter/CandidatesPage';
import CandidateDetailPage from './pages/recruiter/CandidateDetailPage';
import IntegrationsPage from './pages/recruiter/IntegrationsPage';
import ActivityLogsPage from './pages/recruiter/ActivityLogsPage';
import SettingsPage from './pages/recruiter/SettingsPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminCandidatesPage from './pages/admin/AdminCandidatesPage';
import AdminBoardsPage from './pages/admin/AdminBoardsPage';

function RecruiterLayout() {
  return <DashboardLayout variant="recruiter" />;
}

function AdminLayout() {
  return <DashboardLayout variant="admin" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="jobs" element={<PublicJobsPage />} />
              <Route path="jobs/:id" element={<PublicJobDetailPage />} />
              <Route path="jobs/:id/apply" element={<ApplyPage />} />
              <Route element={<GuestOnly />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['recruiter', 'admin']} />}>
              <Route path="app" element={<RecruiterLayout />}>
                <Route index element={<RecruiterDashboard />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/new" element={<CreateJobPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="jobs/:id/distribute" element={<JobDistributionPage />} />
                <Route path="candidates" element={<CandidatesPage />} />
                <Route path="candidates/:id" element={<CandidateDetailPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="activity" element={<ActivityLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="recruiters" element={<AdminUsersPage recruitersOnly />} />
                <Route path="jobs" element={<AdminJobsPage />} />
                <Route path="candidates" element={<AdminCandidatesPage />} />
                <Route path="boards" element={<AdminBoardsPage />} />
                <Route
                  path="logs"
                  element={<ActivityLogsPage integrationOnly />}
                />
                <Route path="settings" element={<SettingsPage admin />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
