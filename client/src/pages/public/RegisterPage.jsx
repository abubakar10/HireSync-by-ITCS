import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/helpers';
import Input, { Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'recruiter',
    company: '',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created');
      navigate(user.role === 'recruiter' ? '/app' : '/jobs', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
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
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Register as a recruiter to explore distribution and candidate pipelines.
        </p>
      </div>
      <Card>
        <CardBody>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              label="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Work email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Corp"
            />
            <Select
              label="I am a"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="recruiter">Recruiter</option>
              <option value="candidate">Candidate</option>
            </Select>
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="At least 8 characters"
            />
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Log in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
