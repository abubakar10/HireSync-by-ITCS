import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

const empty = {
  title: '',
  description: '',
  company: '',
  location: '',
  employmentType: 'Full-time',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  skills: '',
};

export default function CreateJobPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...empty, company: user?.company || '' });
  const [loading, setLoading] = useState(false);

  const buildPayload = (status) => ({
    title: form.title,
    description: form.description,
    company: form.company,
    location: form.location,
    employmentType: form.employmentType,
    salaryMin: Number(form.salaryMin) || 0,
    salaryMax: Number(form.salaryMax) || 0,
    currency: form.currency,
    skills: form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    status,
  });

  const save = async (status, distribute = false) => {
    setLoading(true);
    try {
      const { data } = await jobsApi.create(buildPayload(status));
      const job = data.data.job;
      toast.success(status === 'published' ? 'Job published' : 'Draft saved');
      if (distribute) {
        navigate(`/app/jobs/${job._id}/distribute`);
      } else {
        navigate(`/app/jobs/${job._id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create job"
        description="Save a draft, publish immediately, or continue to multi-board distribution."
      />

      <Card>
        <CardBody>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save('draft');
            }}
          >
            <div className="md:col-span-2">
              <Input
                label="Job title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Senior Frontend Engineer"
              />
            </div>
            <Input
              label="Company"
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <Input
              label="Location"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Remote / Manila, Philippines"
            />
            <Select
              label="Employment type"
              value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
              <option>Remote</option>
            </Select>
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option>USD</option>
              <option>PHP</option>
              <option>SGD</option>
              <option>INR</option>
              <option>EUR</option>
            </Select>
            <Input
              label="Salary min"
              type="number"
              min="0"
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
            />
            <Input
              label="Salary max"
              type="number"
              min="0"
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
            />
            <div className="md:col-span-2">
              <Input
                label="Skills"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, TypeScript, Node.js"
                hint="Comma-separated"
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                required
                rows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe responsibilities, requirements, and benefits."
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              <Button type="submit" variant="secondary" loading={loading}>
                Save draft
              </Button>
              <Button
                type="button"
                loading={loading}
                onClick={() => save('published')}
              >
                Publish
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={loading}
                onClick={() => save('published', true)}
              >
                Publish & distribute
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
