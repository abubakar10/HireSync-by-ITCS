import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Layers,
  Share2,
  Users,
  CheckCircle2,
  Plug,
} from 'lucide-react';
import Button from '../../components/ui/Button';

const boards = [
  'Indeed',
  'LinkedIn',
  'Monster',
  'Glassdoor',
  'ZipRecruiter',
  'JobStreet',
  'Kalibrr',
  'OnlineJobs.ph',
  'JobsDB',
  'PhilJobNet',
  'Naukri',
  'Shine',
  'Foundit',
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100 via-ink-50 to-ink-50" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(30,36,48,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,36,48,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
              HireSync
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.25rem]">
              Publish Jobs Everywhere. Manage Every Candidate in One Place.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-600">
              Connect your recruitment workflow with multiple job boards and bring every
              application back into one candidate pipeline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">
                  Start free demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
                  Recruiter login
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Demo architecture — job board APIs are mocked until real credentials are connected.
            </p>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-xl shadow-brand-900/5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink-900">Candidate pipeline</p>
                <span className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                  Live demo view
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'New', count: 12, source: 'Indeed' },
                  { label: 'Screening', count: 8, source: 'LinkedIn' },
                  { label: 'Interview', count: 5, source: 'JobStreet' },
                ].map((col) => (
                  <div key={col.label} className="rounded-2xl bg-ink-50 p-3">
                    <p className="text-xs font-semibold text-ink-500">{col.label}</p>
                    <p className="mt-1 font-display text-2xl font-bold text-ink-900">{col.count}</p>
                    <p className="mt-3 truncate rounded-lg bg-white px-2 py-2 text-[11px] text-ink-600 shadow-sm">
                      Source: {col.source}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
                <p className="text-sm font-semibold text-brand-800">Distribution ready</p>
                <p className="mt-1 text-xs text-brand-700">
                  Publish one job to Indeed, Kalibrr, JobStreet, and more — then sync applications back.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-ink-900">How it works</h2>
        <p className="mt-2 max-w-2xl text-ink-600">
          Three steps from posting to hire — without juggling separate board inboxes.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Layers,
              title: 'Create once',
              text: 'Write the job in HireSync with salary, skills, and location.',
            },
            {
              icon: Share2,
              title: 'Distribute everywhere',
              text: 'Select boards and publish through adapters built for real APIs later.',
            },
            {
              icon: Users,
              title: 'Hire in one pipeline',
              text: 'Applications return with source tracking into New → Hired stages.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-ink-200 bg-white p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-ink-900">Job distribution</h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            See connection type and publish status per board before you go live.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {boards.slice(0, 6).map((name, i) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink-900">{name}</p>
                  <p className="text-xs text-ink-500">{i % 2 === 0 ? 'API' : 'XML Feed'} · Demo</p>
                </div>
                <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
                  {i < 3 ? 'Connected' : 'Available'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink-900">Candidate management</h2>
            <p className="mt-2 text-ink-600">
              Track every applicant by source — Indeed, LinkedIn, JobStreet, Direct, and more —
              with status changes and internal notes.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Kanban pipeline: New, Screening, Shortlisted, Interview, Rejected, Hired',
                'Duplicate application protection per job',
                'Inbound webhook simulation for board sync demos',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-gradient-to-br from-white to-brand-50 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-brand-700" />
              <p className="font-semibold text-ink-900">Analytics built in</p>
            </div>
            <p className="mt-2 text-sm text-ink-600">
              Applications over time, candidates by source, and jobs by status — so recruiting
              leaders see what channels actually deliver.
            </p>
          </div>
        </div>
      </section>

      <section id="integrations" className="border-t border-ink-200 bg-ink-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-brand-300">
            <Plug className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">Integrations</p>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold">Ready for real board APIs</h2>
          <p className="mt-2 max-w-2xl text-ink-300">
            Adapter interfaces already expose publish, update, close, getApplications, and
            testConnection — swap mocks for production SDKs when credentials arrive.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {boards.map((b) => (
              <span
                key={b}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-ink-100"
              >
                {b}
              </span>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/register">
              <Button size="lg" className="bg-white text-ink-900 hover:bg-ink-100">
                Open the demo workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
