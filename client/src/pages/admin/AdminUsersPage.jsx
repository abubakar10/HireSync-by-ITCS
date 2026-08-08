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

      <div className="filter-bar max-w-sm sm:max-w-none sm:grid-cols-1 md:max-w-sm">
        <Input
          placeholder="Search name, email, company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-semibold text-ink-900">{u.name}</td>
                    <td className="text-ink-600">{u.email}</td>
                    <td>
                      <Badge>{u.role}</Badge>
                    </td>
                    <td>{u.company || '—'}</td>
                    <td>
                      <Badge status={u.isActive ? 'published' : 'closed'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-ink-500">{formatDate(u.createdAt)}</td>
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
