import { useEffect, useState } from 'react';
import { usersApi } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function AdminUsersPage({ recruitersOnly = false }) {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: recruitersOnly ? 'recruiter' : 'recruiter',
    company: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = recruitersOnly
        ? await usersApi.recruiters({ search: search || undefined })
        : await usersApi.list({ search: search || undefined });
      setUsers(data.data.users);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, recruitersOnly]);

  const create = async () => {
    setSaving(true);
    try {
      await usersApi.create(form);
      toast.success('User created');
      setOpen(false);
      setForm({
        name: '',
        email: '',
        password: 'Password123!',
        role: 'recruiter',
        company: '',
      });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={recruitersOnly ? 'Recruiters' : 'Users'}
        description={
          recruitersOnly
            ? 'Recruiter accounts across all companies.'
            : 'Manage admin, recruiter, and candidate accounts.'
        }
        actions={
          <Button onClick={() => setOpen(true)}>
            {recruitersOnly ? 'Add recruiter' : 'Add user'}
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search name, email, company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-ink-50">
                    <td className="px-4 py-3 font-semibold text-ink-900">{u.name}</td>
                    <td className="px-4 py-3 text-ink-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">{u.company || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={u.isActive ? 'published' : 'closed'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={recruitersOnly ? 'Add recruiter' : 'Add user'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={create}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          {!recruitersOnly && (
            <Select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
              <option value="candidate">Candidate</option>
            </Select>
          )}
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
