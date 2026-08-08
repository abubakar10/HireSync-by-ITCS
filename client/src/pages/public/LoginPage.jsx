import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/helpers';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

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
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-900">Log in</h1>
        <p className="mt-2 text-sm text-ink-500">
          Use demo credentials or your HireSync account.
        </p>
      </div>
      <Card>
        <CardBody>
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
          <div className="mt-5 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
            <p className="font-semibold text-ink-800">Demo accounts</p>
            <p className="mt-1">Admin: admin@hiresync.demo</p>
            <p>Recruiter: rita@acmecorp.demo</p>
            <p>Password: Password123!</p>
          </div>
          <p className="mt-4 text-center text-sm text-ink-500">
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
