/**
 * Security / permissions boundary checks against a running API.
 * Usage: node src/tests/security-permissions.js
 * Requires seeded DB + server on BASE_URL (default http://localhost:5000)
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';

const results = [];

const req = async (method, path, { token, body, headers = {} } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const step = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail || '' });
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (err) {
    results.push({ name, ok: false, detail: err.message });
    console.error(`FAIL  ${name} — ${err.message}`);
  }
};

const login = async (email, password) => {
  const { status, data } = await req('POST', '/auth/login', {
    body: { email, password },
  });
  assert(status === 200, `login failed for ${email}: ${status}`);
  assert(data?.data?.token, 'missing token');
  assert(!data.data.user?.password, 'password leaked in login response');
  return data.data;
};

const main = async () => {
  console.log(`\nSecurity permission checks → ${BASE}\n`);

  let recruiter;
  let admin;
  let otherRecruiter;
  let foreignJobId;

  await step('Unauthenticated cannot hit /users', async () => {
    const { status } = await req('GET', '/users');
    assert(status === 401, `expected 401 got ${status}`);
  });

  await step('Unauthenticated cannot hit /jobs/stats/dashboard', async () => {
    const { status } = await req('GET', '/jobs/stats/dashboard');
    assert(status === 401, `expected 401 got ${status}`);
  });

  await step('Unauthenticated cannot hit /candidates', async () => {
    const { status } = await req('GET', '/candidates');
    assert(status === 401, `expected 401 got ${status}`);
  });

  await step('Unauthenticated cannot hit /integrations/stats/admin', async () => {
    const { status } = await req('GET', '/integrations/stats/admin');
    assert(status === 401, `expected 401 got ${status}`);
  });

  await step('Login demo accounts', async () => {
    recruiter = await login('rita@acmecorp.demo', 'Password123!');
    admin = await login('admin@hiresync.demo', 'Password123!');
    otherRecruiter = await login('sam@northstar.demo', 'Password123!');
    assert(recruiter.user.role === 'recruiter', 'rita not recruiter');
    assert(admin.user.role === 'admin', 'admin role mismatch');
    return `${recruiter.user.email} + ${admin.user.email}`;
  });

  await step('Recruiter cannot access admin /users', async () => {
    const { status } = await req('GET', '/users', { token: recruiter.token });
    assert(status === 403, `expected 403 got ${status}`);
  });

  await step('Recruiter cannot access /integrations/stats/admin', async () => {
    const { status } = await req('GET', '/integrations/stats/admin', {
      token: recruiter.token,
    });
    assert(status === 403, `expected 403 got ${status}`);
  });

  await step('Recruiter cannot PATCH integrations', async () => {
    const list = await req('GET', '/integrations', { token: recruiter.token });
    assert(list.status === 200, 'integrations list failed');
    const id = list.data.data.integrations[0]?._id;
    assert(id, 'no integration');
    const { status } = await req('PATCH', `/integrations/${id}`, {
      token: recruiter.token,
      body: { enabled: true },
    });
    assert(status === 403, `expected 403 got ${status}`);
  });

  await step('Recruiter cannot create admin via register', async () => {
    const email = `probe.admin.${Date.now()}@example.com`;
    const { status, data } = await req('POST', '/auth/register', {
      body: {
        name: 'Probe',
        email,
        password: 'Password123!',
        role: 'admin',
      },
    });
    // role admin is rejected by validator (not in allowed list) OR forced to candidate
    if (status === 201) {
      assert(data.data.user.role !== 'admin', 'admin self-signup succeeded');
    } else {
      assert([400, 403].includes(status), `unexpected ${status}`);
    }
  });

  await step('Recruiter A cannot read Recruiter B job', async () => {
    const jobs = await req('GET', '/jobs?limit=5', { token: otherRecruiter.token });
    assert(jobs.status === 200, 'other recruiter jobs failed');
    foreignJobId = jobs.data.data.jobs[0]?._id;
    assert(foreignJobId, 'need a job owned by other recruiter');
    const { status } = await req('GET', `/jobs/${foreignJobId}`, {
      token: recruiter.token,
    });
    // draft/unpublished of other = 404; published of other is visible publicly
    if (jobs.data.data.jobs[0].status !== 'published') {
      assert(status === 404, `expected 404 got ${status}`);
    } else {
      assert(status === 200, 'published jobs are public');
    }
    return `job ${foreignJobId} status=${jobs.data.data.jobs[0].status}`;
  });

  await step('Recruiter A cannot create candidate on Recruiter B job', async () => {
    assert(foreignJobId, 'missing foreign job');
    const { status } = await req('POST', '/candidates', {
      token: recruiter.token,
      body: {
        jobId: foreignJobId,
        name: 'Cross Tenant',
        email: `cross.${Date.now()}@example.com`,
        source: 'Direct',
      },
    });
    assert(status === 403, `expected 403 got ${status}`);
  });

  await step('Recruiter A cannot list Recruiter B candidates for foreign jobId', async () => {
    const { status, data } = await req(
      'GET',
      `/candidates?jobId=${foreignJobId}`,
      { token: recruiter.token }
    );
    assert(status === 403, `expected 403 got ${status} body=${JSON.stringify(data)}`);
  });

  await step('Public apply cannot spoof LinkedIn source', async () => {
    const jobs = await req('GET', '/jobs?limit=20');
    const published = jobs.data.data.jobs.find((j) => j.status === 'published');
    assert(published, 'need published job');
    const { status, data } = await req('POST', '/candidates', {
      body: {
        jobId: published._id,
        name: 'Spoof Source',
        email: `spoof.${Date.now()}@example.com`,
        source: 'LinkedIn',
      },
    });
    assert(status === 201, `apply failed ${status}`);
    assert(data.data.candidate.source === 'Direct', `got ${data.data.candidate.source}`);
  });

  await step('Public job payloads omit recruiter email', async () => {
    const { status, data } = await req('GET', '/jobs?limit=5');
    assert(status === 200, `got ${status}`);
    for (const job of data.data.jobs) {
      if (job.createdBy && typeof job.createdBy === 'object') {
        assert(
          job.createdBy.email === undefined,
          `email exposed on job ${job._id}`
        );
      }
    }
  });

  await step('Invalid JWT rejected', async () => {
    const { status } = await req('GET', '/auth/me', { token: 'not.a.jwt' });
    assert(status === 401, `expected 401 got ${status}`);
  });

  await step('Webhook without secret still works when WEBHOOK_SECRET unset', async () => {
    const health = await req('GET', '/health');
    assert(health.status === 200, 'health failed');
    if (health.data.data.webhookAuthRequired) {
      const { status } = await req('POST', '/integrations/Indeed/applications', {
        body: {
          externalJobId: 'missing',
          name: 'X',
          email: 'x@example.com',
        },
      });
      assert(status === 401, `expected 401 got ${status}`);
      return 'secret required — unauthorized without header';
    }
    return 'secret not configured (demo OK)';
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
