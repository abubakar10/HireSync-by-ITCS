/**
 * End-to-end API smoke tests against a running server.
 * Usage: node src/tests/api.smoke.js
 * Expects BASE_URL (default http://localhost:5000)
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';

let passed = 0;
let failed = 0;
const failures = [];

const req = async (method, path, { token, body, expectStatus } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
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

const test = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    failures.push({ name, error: err.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'Assertion failed');
};

async function run() {
  console.log(`\nAPI smoke tests → ${BASE}\n`);

  let adminToken;
  let recruiterToken;
  let jobId;
  let candidateId;
  let distributionExternalId;
  let integrationId;

  await test('GET /api/health', async () => {
    const { data } = await req('GET', '/api/health', { expectStatus: 200 });
    assert(data.success === true, 'success should be true');
    assert(data.data.status === 'ok', 'status ok');
  });

  await test('POST /api/auth/login (admin)', async () => {
    const { data } = await req('POST', '/api/auth/login', {
      body: { email: 'admin@hiresync.demo', password: 'Password123!' },
      expectStatus: 200,
    });
    assert(data.data.token, 'token missing');
    assert(data.data.user.role === 'admin', 'role admin');
    assert(!data.data.user.password, 'password must not be exposed');
    adminToken = data.data.token;
  });

  await test('POST /api/auth/login (recruiter)', async () => {
    const { data } = await req('POST', '/api/auth/login', {
      body: { email: 'rita@acmecorp.demo', password: 'Password123!' },
      expectStatus: 200,
    });
    assert(data.data.user.role === 'recruiter');
    recruiterToken = data.data.token;
  });

  await test('POST /api/auth/login (invalid)', async () => {
    await req('POST', '/api/auth/login', {
      body: { email: 'admin@hiresync.demo', password: 'wrong' },
      expectStatus: 401,
    });
  });

  await test('GET /api/auth/me', async () => {
    const { data } = await req('GET', '/api/auth/me', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(data.data.user.email === 'admin@hiresync.demo');
  });

  await test('GET /api/auth/me (no token)', async () => {
    await req('GET', '/api/auth/me', { expectStatus: 401 });
  });

  await test('POST /api/auth/register', async () => {
    const email = `cand.${Date.now()}@example.com`;
    const { data } = await req('POST', '/api/auth/register', {
      body: {
        name: 'New Candidate',
        email,
        password: 'Password123!',
        role: 'candidate',
      },
      expectStatus: 201,
    });
    assert(data.data.user.role === 'candidate');
    assert(data.data.token);
  });

  await test('POST /api/auth/register blocks public admin', async () => {
    const { data } = await req('POST', '/api/auth/register', {
      body: {
        name: 'Hacker',
        email: `hack.${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'admin',
      },
      expectStatus: 201,
    });
    assert(data.data.user.role === 'candidate', 'admin self-register must be downgraded');
  });

  await test('GET /api/users (admin)', async () => {
    const { data } = await req('GET', '/api/users', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(Array.isArray(data.data.users));
    assert(data.data.users.length >= 4);
  });

  await test('GET /api/users (recruiter forbidden)', async () => {
    await req('GET', '/api/users', {
      token: recruiterToken,
      expectStatus: 403,
    });
  });

  await test('GET /api/users/recruiters', async () => {
    const { data } = await req('GET', '/api/users/recruiters', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(data.data.users.every((u) => u.role === 'recruiter'));
  });

  await test('POST /api/users (admin create)', async () => {
    const { data } = await req('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Temp Recruiter',
        email: `temp.rec.${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'recruiter',
        company: 'Temp Co',
      },
      expectStatus: 201,
    });
    assert(data.data.user.role === 'recruiter');
  });

  await test('GET /api/jobs (public published)', async () => {
    const { data } = await req('GET', '/api/jobs', { expectStatus: 200 });
    assert(data.data.jobs.every((j) => j.status === 'published'));
  });

  await test('GET /api/jobs (recruiter with filters)', async () => {
    const { data } = await req(
      'GET',
      '/api/jobs?search=Frontend&sort=newest&page=1&limit=5',
      { token: recruiterToken, expectStatus: 200 }
    );
    assert(data.data.pagination);
  });

  await test('POST /api/jobs (create draft)', async () => {
    const { data } = await req('POST', '/api/jobs', {
      token: recruiterToken,
      body: {
        title: 'API Test Engineer',
        description: 'Created by smoke test',
        company: 'Acme Corp',
        location: 'Remote',
        employmentType: 'Full-time',
        salaryMin: 50000,
        salaryMax: 80000,
        skills: ['API', 'Testing'],
        status: 'draft',
      },
      expectStatus: 201,
    });
    jobId = data.data.job._id;
    assert(data.data.job.status === 'draft');
  });

  await test('GET /api/jobs/:id (draft hidden from public)', async () => {
    await req('GET', `/api/jobs/${jobId}`, { expectStatus: 404 });
  });

  await test('POST /api/jobs/:id/publish', async () => {
    const { data } = await req('POST', `/api/jobs/${jobId}/publish`, {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(data.data.job.status === 'published');
  });

  await test('PATCH /api/jobs/:id', async () => {
    const { data } = await req('PATCH', `/api/jobs/${jobId}`, {
      token: recruiterToken,
      body: { location: 'Austin, TX' },
      expectStatus: 200,
    });
    assert(data.data.job.location === 'Austin, TX');
  });

  await test('GET /api/jobs/stats/dashboard', async () => {
    const { data } = await req('GET', '/api/jobs/stats/dashboard', {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(data.data.stats);
    assert(data.data.charts);
  });

  await test('GET /api/distribution/boards', async () => {
    const { data } = await req('GET', '/api/distribution/boards', {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(data.data.boards.length >= 13);
  });

  await test('POST /api/distribution/publish', async () => {
    const { data } = await req('POST', '/api/distribution/publish', {
      token: recruiterToken,
      body: { jobId, boards: ['Indeed', 'Kalibrr'] },
      expectStatus: 200,
    });
    assert(data.data.isDemo === true);
    assert(data.data.results.length === 2);
    const ok = data.data.results.find((r) => r.success);
    assert(ok, 'at least one publish should succeed');
    distributionExternalId = ok.externalJobId;
  });

  await test('GET /api/distribution/job/:jobId', async () => {
    const { data } = await req('GET', `/api/distribution/job/${jobId}`, {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(data.data.boards.some((b) => b.publishedStatus === 'published'));
  });

  await test('GET /api/distribution', async () => {
    const { data } = await req('GET', '/api/distribution', {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(Array.isArray(data.data.distributions));
  });

  await test('POST /api/candidates (apply)', async () => {
    const { data } = await req('POST', '/api/candidates', {
      body: {
        name: 'Smoke Tester',
        email: `smoke.${Date.now()}@example.com`,
        phone: '+15551234567',
        coverLetter: 'Hello from smoke test',
        source: 'Direct',
        jobId,
      },
      expectStatus: 201,
    });
    candidateId = data.data.candidate._id;
  });

  await test('POST /api/candidates (duplicate blocked)', async () => {
    const email = `dup.${Date.now()}@example.com`;
    await req('POST', '/api/candidates', {
      body: {
        name: 'Dup One',
        email,
        source: 'Direct',
        jobId,
      },
      expectStatus: 201,
    });
    await req('POST', '/api/candidates', {
      body: {
        name: 'Dup Two',
        email,
        source: 'Direct',
        jobId,
      },
      expectStatus: 409,
    });
  });

  await test('GET /api/candidates/pipeline', async () => {
    const { data } = await req('GET', '/api/candidates/pipeline', {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(data.data.columns.New);
  });

  await test('GET /api/candidates/:id', async () => {
    const { data } = await req('GET', `/api/candidates/${candidateId}`, {
      token: recruiterToken,
      expectStatus: 200,
    });
    assert(data.data.candidate._id === candidateId);
  });

  await test('PATCH /api/candidates/:id (status)', async () => {
    const { data } = await req('PATCH', `/api/candidates/${candidateId}`, {
      token: recruiterToken,
      body: { status: 'Screening', note: 'Looks promising' },
      expectStatus: 200,
    });
    assert(data.data.candidate.status === 'Screening');
  });

  await test('GET /api/integrations', async () => {
    const { data } = await req('GET', '/api/integrations', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(data.data.integrations.length >= 13);
    integrationId = data.data.integrations[0]._id;
  });

  await test('POST /api/integrations/:id/test', async () => {
    const { data } = await req('POST', `/api/integrations/${integrationId}/test`, {
      token: adminToken,
      expectStatus: 200,
    });
    assert(data.data.isDemo === true);
  });

  await test('POST /api/integrations/:board/applications (webhook)', async () => {
    assert(distributionExternalId, 'need externalJobId from publish');
    const { data } = await req('POST', '/api/integrations/Indeed/applications', {
      body: {
        externalJobId: distributionExternalId,
        name: 'Webhook Applicant',
        email: `webhook.${Date.now()}@example.com`,
        phone: '+19998887777',
        resumeUrl: 'https://example.com/r.pdf',
        coverLetter: 'Inbound demo',
      },
      expectStatus: 201,
    });
    assert(data.data.candidate.source === 'Indeed');
    assert(data.data.isDemo === true);
  });

  await test('POST /api/integrations/simulate-application', async () => {
    const { data } = await req('POST', '/api/integrations/simulate-application', {
      token: adminToken,
      body: {
        board: 'Indeed',
        externalJobId: distributionExternalId,
        name: 'Simulated User',
      },
      expectStatus: 201,
    });
    assert(data.data.isDemo === true);
  });

  await test('GET /api/integrations/stats/admin', async () => {
    const { data } = await req('GET', '/api/integrations/stats/admin', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(data.data.stats.totalRecruiters >= 3);
  });

  await test('GET /api/activity', async () => {
    const { data } = await req('GET', '/api/activity', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(Array.isArray(data.data.logs));
  });

  await test('GET /api/activity/integration-logs', async () => {
    const { data } = await req('GET', '/api/activity/integration-logs?status=success', {
      token: adminToken,
      expectStatus: 200,
    });
    assert(Array.isArray(data.data.logs));
  });

  await test('POST /api/auth/logout', async () => {
    await req('POST', '/api/auth/logout', {
      token: adminToken,
      expectStatus: 200,
    });
  });

  await test('Validation error shape', async () => {
    const { data } = await req('POST', '/api/auth/login', {
      body: { email: 'not-an-email', password: '' },
      expectStatus: 400,
    });
    assert(data.success === false);
    assert(Array.isArray(data.errors));
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failures.length) {
    console.log('Failures:');
    for (const f of failures) console.log(` - ${f.name}: ${f.error}`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
