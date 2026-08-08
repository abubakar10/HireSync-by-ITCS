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
import { DemoBadge } from '../../components/ui/Badge';

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

const pipelinePreview = [
  {
    stage: 'New',
    people: [
      { name: 'Maya Santillan', role: 'Frontend Engineer', source: 'Indeed' },
      { name: 'Jordan Lee', role: 'Product Designer', source: 'LinkedIn' },
    ],
  },
  {
    stage: 'Screening',
    people: [
      { name: 'Priya Nair', role: 'Backend Engineer', source: 'JobStreet' },
      { name: 'Alex Chen', role: 'Data Analyst', source: 'Kalibrr' },
    ],
  },
  {
    stage: 'Interview',
    people: [
      { name: 'Sam Rivera', role: 'DevOps Engineer', source: 'OnlineJobs.ph' },
    ],
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_80%_-10%,#d5eee2_0%,transparent_55%),linear-gradient(180deg,#f7f8fa_0%,#eef8f3_100%)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(28,34,44,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,34,44,0.035) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:pt-24">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">
            HireSync
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.35rem]">
            Publish jobs everywhere. Hire from one pipeline.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
            Distribute openings to multiple boards, sync applications back, and move every
            candidate through a single recruiting workflow.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
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
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <DemoBadge />
            Board APIs are mocked until real credentials are connected.
          </p>
        </div>
      </section>

      <section className="border-b border-ink-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                Candidate pipeline
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Applications arrive with board source tracking — New through Hired.
              </p>
            </div>
            <DemoBadge />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pipelinePreview.map((col) => (
              <div
                key={col.stage}
                className="w-64 shrink-0 rounded-2xl border border-ink-200/80 bg-ink-50/80 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-ink-800">{col.stage}</p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-ink-500">
                    {col.people.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.people.map((p) => (
                    <div
                      key={p.name}
                      className="rounded-xl border border-ink-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(28,34,44,0.04)]"
                    >
                      <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{p.role}</p>
                      <p className="mt-2 text-[11px] font-medium text-brand-700">
                        Source: {p.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
            <div key={step.title} className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,34,44,0.04)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <step.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.text}</p>
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
                className="flex items-center justify-between rounded-xl border border-ink-200/80 px-4 py-3.5"
              >
                <div>
                  <p className="font-semibold text-ink-900">{name}</p>
                  <p className="text-xs text-ink-500">
                    {i % 2 === 0 ? 'API' : 'XML Feed'} · Demo adapter
                  </p>
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
            <h2 className="font-display text-3xl font-bold text-ink-900">
              Candidate management
            </h2>
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
          <div className="rounded-2xl border border-ink-200/80 bg-brand-50/40 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-brand-700" />
              <p className="font-semibold text-ink-900">Recruiting analytics</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Applications over time, candidates by source, and jobs by status — so recruiting
              teams can see which channels deliver hires.
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
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-ink-100"
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
