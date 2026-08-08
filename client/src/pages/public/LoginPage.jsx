import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/helpers';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'rita@acmecorp.demo', password: 'Password123!' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}`);
      const redirect =
        location.state?.from?.pathname ||
        (user.role === 'admin' ? '/admin' : user.role === 'recruiter' ? '/app' : '/jobs');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-900/20">
          <Briefcase className="h-5 w-5" />
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">
          Log in to HireSync
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Use a demo account or your own HireSync credentials.
        </p>
      </div>
      <Card>
        <CardBody className="space-y-5">
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" loading={loading}>
              Continue
            </Button>
          </form>
          <Alert tone="info" title="Demo accounts">
            <p>Admin: admin@hiresync.demo</p>
            <p>Recruiter: rita@acmecorp.demo</p>
            <p>Password: Password123!</p>
          </Alert>
          <p className="text-center text-sm text-ink-500">
            No account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Register
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
