import {
  User,
  Job,
  JobDistribution,
  Candidate,
  Integration,
  ActivityLog,
} from '../models/index.js';
import { hashPassword } from '../utils/helpers.js';
import { BOARD_CATALOG } from '../constants/boards.js';

const DEMO_PASSWORD = 'Password123!';

const firstNames = [
  'John', 'Jane', 'Maria', 'Carlos', 'Aisha', 'Kenji', 'Priya', 'Omar',
  'Sofia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Mia',
  'Lucas', 'Isabella', 'Mason', 'Amelia', 'James', 'Harper', 'Benjamin',
  'Evelyn', 'Henry', 'Chloe', 'Alexander', 'Grace', 'Daniel', 'Zoe',
];

const lastNames = [
  'Smith', 'Garcia', 'Patel', 'Chen', 'Santos', 'Kim', 'Reyes', 'Nguyen',
  'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson',
];

const sources = [
  'Indeed', 'LinkedIn', 'Monster', 'JobStreet', 'Kalibrr',
  'OnlineJobs.ph', 'JobsDB', 'Direct',
];

const statuses = ['New', 'Screening', 'Shortlisted', 'Interview', 'Rejected', 'Hired'];

const jobTemplates = [
  {
    title: 'Senior Frontend Engineer',
    location: 'Remote',
    employmentType: 'Remote',
    skills: ['React', 'TypeScript', 'Tailwind'],
    salaryMin: 90000,
    salaryMax: 130000,
  },
  {
    title: 'Backend Node.js Developer',
    location: 'Manila, Philippines',
    employmentType: 'Full-time',
    skills: ['Node.js', 'Express', 'MongoDB'],
    salaryMin: 60000,
    salaryMax: 90000,
  },
  {
    title: 'Full Stack Engineer',
    location: 'Singapore',
    employmentType: 'Full-time',
    skills: ['React', 'Node.js', 'AWS'],
    salaryMin: 80000,
    salaryMax: 120000,
  },
  {
    title: 'DevOps Engineer',
    location: 'Bangalore, India',
    employmentType: 'Full-time',
    skills: ['Kubernetes', 'Docker', 'CI/CD'],
    salaryMin: 70000,
    salaryMax: 110000,
  },
  {
    title: 'Product Designer',
    location: 'Jakarta, Indonesia',
    employmentType: 'Contract',
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    salaryMin: 50000,
    salaryMax: 75000,
  },
  {
    title: 'QA Automation Engineer',
    location: 'Kuala Lumpur, Malaysia',
    employmentType: 'Full-time',
    skills: ['Cypress', 'Playwright', 'Jest'],
    salaryMin: 45000,
    salaryMax: 70000,
  },
  {
    title: 'Data Analyst',
    location: 'Remote',
    employmentType: 'Part-time',
    skills: ['SQL', 'Python', 'Tableau'],
    salaryMin: 40000,
    salaryMax: 65000,
  },
  {
    title: 'Mobile Developer (React Native)',
    location: 'Ho Chi Minh City, Vietnam',
    employmentType: 'Full-time',
    skills: ['React Native', 'iOS', 'Android'],
    salaryMin: 55000,
    salaryMax: 85000,
  },
  {
    title: 'Technical Recruiter',
    location: 'Makati, Philippines',
    employmentType: 'Full-time',
    skills: ['Sourcing', 'ATS', 'Interviewing'],
    salaryMin: 35000,
    salaryMax: 55000,
  },
  {
    title: 'Customer Success Manager',
    location: 'Dubai, UAE',
    employmentType: 'Full-time',
    skills: ['SaaS', 'CRM', 'Onboarding'],
    salaryMin: 65000,
    salaryMax: 95000,
  },
];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export async function seedDatabase({ clear = true } = {}) {
  if (clear) {
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      JobDistribution.deleteMany({}),
      Candidate.deleteMany({}),
      Integration.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);
  }

  const password = await hashPassword(DEMO_PASSWORD);

  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@hiresync.demo',
    password,
    role: 'admin',
    company: 'HireSync',
  });

  const recruiters = await User.insertMany([
    {
      name: 'Rita Recruiter',
      email: 'rita@acmecorp.demo',
      password,
      role: 'recruiter',
      company: 'Acme Corp',
    },
    {
      name: 'Sam Talent',
      email: 'sam@northstar.demo',
      password,
      role: 'recruiter',
      company: 'Northstar Labs',
    },
    {
      name: 'Priya Hire',
      email: 'priya@brightpath.demo',
      password,
      role: 'recruiter',
      company: 'BrightPath Solutions',
    },
  ]);

  const integrations = await Integration.insertMany(
    BOARD_CATALOG.map((b) => ({
      name: b.name,
      type: b.type,
      region: b.region,
      status: b.defaultStatus,
      enabled: b.defaultStatus === 'connected',
      isDemo: true,
      configuration: { mode: 'demo', note: 'Mock adapter — no real API credentials' },
      lastSyncAt: b.defaultStatus === 'connected' ? daysAgo(1) : null,
    }))
  );

  const jobs = [];
  for (let i = 0; i < jobTemplates.length; i++) {
    const template = jobTemplates[i];
    const recruiter = recruiters[i % recruiters.length];
    const status = i < 7 ? 'published' : i === 7 ? 'draft' : i === 8 ? 'closed' : 'published';
    const job = await Job.create({
      ...template,
      description: `${template.title} role at ${recruiter.company}. We are looking for someone skilled in ${template.skills.join(', ')}. This is demo content for HireSync.`,
      company: recruiter.company,
      currency: 'USD',
      status,
      createdBy: recruiter._id,
      publishedAt: status === 'published' ? daysAgo(10 - (i % 8)) : null,
      createdAt: daysAgo(14 - i),
    });
    jobs.push(job);
  }

  const publishedJobs = jobs.filter((j) => j.status === 'published');
  const connectedBoards = integrations.filter((i) => i.status === 'connected');

  const distributions = [];
  for (const job of publishedJobs.slice(0, 6)) {
    for (const board of connectedBoards) {
      const dist = await JobDistribution.create({
        jobId: job._id,
        board: board.name,
        status: 'published',
        externalJobId: `${board.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-demo-${job._id.toString().slice(-6)}`,
        publishedAt: daysAgo(5),
        lastSyncedAt: daysAgo(1),
        durationMs: 400 + Math.floor(Math.random() * 500),
        responsePayload: { mode: 'demo', message: 'Seeded distribution' },
      });
      distributions.push(dist);

      await ActivityLog.create({
        userId: job.createdBy,
        action: 'Job Published',
        entity: 'JobDistribution',
        entityId: dist._id,
        board: board.name,
        status: 'success',
        response: `[DEMO] Job published to ${board.name} (mock)`,
        durationMs: dist.durationMs,
        details: { jobId: job._id, jobTitle: job.title, isDemo: true },
        createdAt: daysAgo(5),
      });
    }
  }

  // One failed publish for realism
  if (publishedJobs[0]) {
    await ActivityLog.create({
      userId: publishedJobs[0].createdBy,
      action: 'Job Published',
      entity: 'JobDistribution',
      entityId: null,
      board: 'LinkedIn',
      status: 'failed',
      response: '[DEMO] Simulated publish failure for LinkedIn',
      durationMs: 620,
      details: { isDemo: true },
      createdAt: daysAgo(3),
    });
  }

  const candidates = [];
  for (let i = 0; i < 30; i++) {
    const job = publishedJobs[i % publishedJobs.length];
    const source = sources[i % sources.length];
    const status = statuses[i % statuses.length];
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const email = `candidate${i + 1}@example.com`;

    const candidate = await Candidate.create({
      name,
      email,
      phone: `+1555${String(1000000 + i).slice(-7)}`,
      resumeUrl: `https://example.com/resumes/${email.split('@')[0]}.pdf`,
      coverLetter: `I am excited to apply for the ${job.title} position. (Demo application)`,
      source,
      jobId: job._id,
      status,
      appliedAt: daysAgo(i % 28),
      externalApplicationId:
        source !== 'Direct' ? `${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-app-${i}` : null,
      timeline: [
        {
          action: 'Application received',
          toStatus: 'New',
          note: `Applied via ${source}`,
          createdAt: daysAgo(i % 28),
        },
        ...(status !== 'New'
          ? [
              {
                action: 'Status changed',
                fromStatus: 'New',
                toStatus: status,
                note: 'Seeded pipeline move',
                createdAt: daysAgo(Math.max(0, (i % 28) - 2)),
              },
            ]
          : []),
      ],
      notes:
        i % 4 === 0
          ? [{ text: 'Strong portfolio — follow up this week.', createdBy: job.createdBy }]
          : [],
    });
    candidates.push(candidate);

    if (source !== 'Direct' && i % 3 === 0) {
      await ActivityLog.create({
        userId: null,
        action: 'Application Sync',
        entity: 'Candidate',
        entityId: candidate._id,
        board: source,
        status: i === 9 ? 'failed' : 'success',
        response:
          i === 9
            ? '[DEMO] Simulated sync failure'
            : `[DEMO] Application synced from ${source}`,
        durationMs: 200 + (i % 10) * 30,
        details: {
          name,
          email,
          jobId: job._id,
          jobTitle: job.title,
          isDemo: true,
        },
        createdAt: daysAgo(i % 28),
      });
    }
  }

  await ActivityLog.create({
    userId: admin._id,
    action: 'user.login',
    entity: 'User',
    entityId: admin._id,
    status: 'success',
    details: { email: admin.email },
  });

  return {
    password: DEMO_PASSWORD,
    users: { admin, recruiters },
    jobs,
    candidates,
    distributions,
    integrations,
    credentials: {
      admin: { email: 'admin@hiresync.demo', password: DEMO_PASSWORD },
      recruiters: recruiters.map((r) => ({
        email: r.email,
        password: DEMO_PASSWORD,
        company: r.company,
      })),
    },
  };
}

// CLI entry
const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith('seed.js') ||
    process.argv[1].includes('seeders\\seed.js') ||
    process.argv[1].includes('seeders/seed.js'));

if (isDirect) {
  const connectDB = (await import('../config/db.js')).default;
  await connectDB();
  const result = await seedDatabase();
  console.log('Seed complete.');
  console.log('Demo credentials:');
  console.log(JSON.stringify(result.credentials, null, 2));
  console.log(
    `Jobs: ${result.jobs.length}, Candidates: ${result.candidates.length}, Distributions: ${result.distributions.length}`
  );
  process.exit(0);
}

export default seedDatabase;
