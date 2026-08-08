/**
 * Full product E2E flow against a live API + MongoDB.
 * Run: node src/tests/e2e-demo-flow.js
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';

const steps = [];
let failed = false;

const req = async (method, path, { token, body, expectStatus } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (expectStatus !== undefined && res.status !== expectStatus) {
    throw new Error(
      `${method} ${path} expected ${expectStatus}, got ${res.status}: ${JSON.stringify(data)}`
    );
  }
  return { status: res.status, data };
};

const step = async (name, fn) => {
  try {
    const detail = await fn();
    steps.push({ name, ok: true, detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (err) {
    failed = true;
    steps.push({ name, ok: false, detail: err.message });
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    throw err;
  }
};

async function run() {
  console.log(`\nE2E demo flow → ${BASE}\n`);

  let recruiterToken;
  let adminToken;
  let jobId;
  let externalIds = [];
  let candidateId;
  let source;

  await step('1. Recruiter logs in', async () => {
    const { data } = await req('POST', '/api/auth/login', {
      body: { email: 'rita@acmecorp.demo', password: 'Password123!' },
      expectStatus: 200,
    });
    if (!data.data?.token) throw new Error('No token');
    if (data.data.user.role !== 'recruiter') throw new Error('Not recruiter');
    recruiterToken = data.data.token;
    return data.data.user.email;
  });

  await step('2. Recruiter creates a job', async () => {
    const { data } = await req('POST', '/api/jobs', {
      token: recruiterToken,
      body: {
        title: 'E2E Platform Engineer',
        description:
          'End-to-end demo role for HireSync. Own multi-board publishing and candidate sync workflows.',
        company: 'Acme Corp',
        location: 'Remote',
        employmentType: 'Full-time',
        salaryMin: 95000,
        salaryMax: 135000,
        currency: 'USD',
        skills: ['Node.js', 'React', 'MongoDB'],
        status: 'draft',
      },
      expectStatus: 201,
    });
    jobId = data.data.job._id;
    if (data.data.job.status !== 'draft') throw new Error('Expected draft');
    return jobId;
  });

  await step('3. Recruiter publishes job to multiple boards', async () => {
    const boards = ['Indeed', 'Kalibrr', 'JobStreet'];
    const { data } = await req('POST', '/api/distribution/publish', {
      token: recruiterToken,
      body: { jobId, boards },
      expectStatus: 200,
    });
    const results = data.data.results || [];
    if (results.length !== 3) throw new Error(`Expected 3 results, got ${results.length}`);
    const ok = results.filter((r) => r.success);
    if (!ok.length) throw new Error('All publishes failed');
    externalIds = ok.map((r) => r.externalJobId).filter(Boolean);
    if (!externalIds.length) throw new Error('No external job IDs');
    return `${ok.length}/${results.length} boards, ids=${externalIds.length}`;
  });

  await step('4. Each distribution has status + externalJobId', async () => {
    const { data } = await req('GET', `/api/distribution/job/${jobId}`, {
      token: recruiterToken,
      expectStatus: 200,
    });
    const published = data.data.boards.filter((b) => b.publishedStatus === 'published');
    if (!published.length) throw new Error('No published boards');
    for (const b of published) {
      if (!b.externalJobId) throw new Error(`${b.name} missing externalJobId`);
    }
    return published.map((b) => `${b.name}:${b.externalJobId}`).join(' | ');
  });

  await step('5. Admin logs in', async () => {
    const { data } = await req('POST', '/api/auth/login', {
      body: { email: 'admin@hiresync.demo', password: 'Password123!' },
      expectStatus: 200,
    });
    adminToken = data.data.token;
    return data.data.user.email;
  });

  await step('6. Admin loads Simulate Application options', async () => {
    const { data } = await req('GET', '/api/integrations/simulate-options', {
      token: adminToken,
      expectStatus: 200,
    });
    const opts = data.data.options || [];
    const match = opts.find((o) => o.externalJobId && externalIds.includes(o.externalJobId));
    if (!match) {
      // may still find by job title
      const byJob = opts.find((o) => o.job?.id === jobId || o.job?.title === 'E2E Platform Engineer');
      if (!byJob) throw new Error('Published posting not in simulate-options');
      return `found via job: ${byJob.board}`;
    }
    return `${match.board} · ${match.externalJobId}`;
  });

  await step('7. Admin simulates candidate application', async () => {
    const { data: optsData } = await req('GET', '/api/integrations/simulate-options', {
      token: adminToken,
      expectStatus: 200,
    });
    const target =
      optsData.data.options.find((o) => externalIds.includes(o.externalJobId)) ||
      optsData.data.options.find((o) => o.job?.title === 'E2E Platform Engineer');
    if (!target) throw new Error('No target posting');

    const { data } = await req('POST', '/api/integrations/simulate-application', {
      token: adminToken,
      body: {
        board: target.board,
        externalJobId: target.externalJobId,
        name: 'E2E Demo Candidate',
        email: `e2e.candidate.${Date.now()}@applicants.demo`,
        phone: '+1 555 010 9999',
        coverLetter: 'Simulated inbound application for end-to-end verification.',
      },
      expectStatus: 201,
    });
    candidateId = data.data.candidate._id;
    source = data.data.candidate.source;
    if (!candidateId) throw new Error('No candidate id');
    if (data.data.pipelineColumn !== 'New') throw new Error('Not in New column');
    return `${data.data.candidate.name} via ${source}`;
  });

  await step('8–9. Candidate created with correct source', async () => {
    const { data } = await req('GET', `/api/candidates/${candidateId}`, {
      token: recruiterToken,
      expectStatus: 200,
    });
    const c = data.data.candidate;
    if (c.name !== 'E2E Demo Candidate') throw new Error('Wrong name');
    if (!c.source || c.source === 'Direct') throw new Error(`Source should be board, got ${c.source}`);
    if (String(c.jobId?._id || c.jobId) !== String(jobId)) throw new Error('Wrong job link');
    if (c.status !== 'New') throw new Error(`Expected New, got ${c.status}`);
    return `source=${c.source} status=${c.status}`;
  });

  await step('10. Candidate appears in New pipeline', async () => {
    const { data } = await req('GET', `/api/candidates/pipeline?jobId=${jobId}`, {
      token: recruiterToken,
      expectStatus: 200,
    });
    const neu = data.data.columns.New || [];
    const found = neu.find((c) => c._id === candidateId);
    if (!found) throw new Error('Candidate not in New column for this job');
    return `New column count=${neu.length}`;
  });

  await step('11–12. Recruiter opens candidate and changes status', async () => {
    const { data } = await req('PATCH', `/api/candidates/${candidateId}`, {
      token: recruiterToken,
      body: {
        status: 'Screening',
        note: 'E2E review — moving to screening after board sync',
      },
      expectStatus: 200,
    });
    if (data.data.candidate.status !== 'Screening') throw new Error('Status not updated');
    const timeline = data.data.candidate.timeline || [];
    if (!timeline.some((t) => t.toStatus === 'Screening')) {
      throw new Error('Timeline missing status change');
    }
    return 'Screening';
  });

  await step('13. Activity log records the actions', async () => {
    const { data } = await req('GET', '/api/activity/integration-logs?limit=50', {
      token: adminToken,
      expectStatus: 200,
    });
    const logs = data.data.logs || [];
    const publishLogs = logs.filter(
      (l) =>
        l.action === 'Job Published' &&
        (l.details?.jobId === jobId ||
          l.details?.jobId === String(jobId) ||
          l.details?.jobTitle === 'E2E Platform Engineer')
    );
    const syncLogs = logs.filter(
      (l) =>
        l.action === 'Application Sync' &&
        (l.details?.jobId === jobId ||
          l.details?.jobId === String(jobId) ||
          l.entityId === candidateId ||
          l.details?.name === 'E2E Demo Candidate')
    );

    const { data: allAct } = await req('GET', '/api/activity?limit=50', {
      token: recruiterToken,
      expectStatus: 200,
    });
    const statusLogs = (allAct.data.logs || []).filter(
      (l) =>
        l.action === 'candidate.status_change' &&
        (l.entityId === candidateId || String(l.entityId) === String(candidateId))
    );
    const recruiterSync = (allAct.data.logs || []).filter(
      (l) =>
        l.action === 'Application Sync' &&
        (l.details?.jobId === jobId ||
          l.details?.jobId === String(jobId) ||
          l.details?.name === 'E2E Demo Candidate')
    );

    if (!publishLogs.length) throw new Error('Missing Job Published logs');
    if (!syncLogs.length) throw new Error('Missing Application Sync logs');
    if (!statusLogs.length) throw new Error('Missing candidate.status_change logs');
    if (!recruiterSync.length) {
      throw new Error('Recruiter cannot see Application Sync for their job (activity filter broken)');
    }

    return `publish=${publishLogs.length} sync=${syncLogs.length} status=${statusLogs.length} recruiterSync=${recruiterSync.length}`;
  });

  console.log('\nAll E2E demo flow steps passed.\n');
}

run().catch(() => {
  console.log('\nE2E demo flow FAILED.\n');
  process.exit(1);
});
