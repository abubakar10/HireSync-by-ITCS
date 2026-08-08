# HireSync — Job Integration System

Multi-platform job publishing and candidate management **demo** (MERN).

> **Important:** All job board integrations (Indeed, LinkedIn, JobStreet, etc.) are **mocked adapters**. This demo does not call real job board APIs unless you later add real credentials and replace the adapters.

## Status

**Backend and frontend are complete.** API smoke tests: 37/37 passing. Client production build succeeds.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend (pending) | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Security | helmet, cors, rate limiting, role middleware |
| Deploy target | Vercel + MongoDB Atlas |

## Quick start (backend)

```bash
npm run install:all

# Option A — real MongoDB (local or Atlas)
# Set MONGODB_URI in server/.env, then:
npm run server
npm run seed

# Option B — run API tests with in-memory MongoDB (no install needed)
npm run test:api
```

API health: `GET http://localhost:5000/api/health`

### Demo credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hiresync.demo` | `Password123!` |
| Recruiter | `rita@acmecorp.demo` | `Password123!` |
| Recruiter | `sam@northstar.demo` | `Password123!` |
| Recruiter | `priya@brightpath.demo` | `Password123!` |

## Environment variables

Copy `.env.example` → `server/.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `USE_MEMORY_DB` | `true` = ephemeral in-memory DB for tests |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CLIENT_URL` | Frontend origin for CORS |
| `DEMO_MODE` | `true` = mocked adapters |

## API structure

Consistent responses:

```json
{ "success": true, "data": {}, "message": "" }
```

```json
{ "success": false, "message": "", "errors": [] }
```

### Auth — `/api/auth`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/register` | Public | Register (admin self-register blocked → candidate) |
| POST | `/login` | Public | Login (rate limited) |
| POST | `/logout` | Auth | Audit logout (stateless JWT) |
| GET | `/me` | Auth | Current user |

### Users — `/api/users`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/` | Admin | List users |
| GET | `/recruiters` | Admin | List recruiters |
| GET | `/:id` | Admin | Get user |
| POST | `/` | Admin | Create user (any role) |
| PATCH | `/:id` | Admin | Update user |
| DELETE | `/:id` | Admin | Soft deactivate |

### Jobs — `/api/jobs`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/` | Public* | List jobs (*published only if public/candidate) |
| GET | `/:id` | Public* | Job details |
| POST | `/` | Recruiter/Admin | Create job |
| PATCH | `/:id` | Owner/Admin | Update job |
| POST | `/:id/publish` | Owner/Admin | Publish job |
| DELETE | `/:id` | Owner/Admin | Archive job |
| GET | `/stats/dashboard` | Recruiter/Admin | Dashboard stats + charts |

Query: `search`, `status`, `location`, `employmentType`, `sort`, `page`, `limit`

### Candidates — `/api/candidates`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/` | Public | Apply to a job |
| GET | `/` | Recruiter/Admin | List candidates |
| GET | `/pipeline` | Recruiter/Admin | Kanban columns |
| GET | `/:id` | Recruiter/Admin | Candidate detail |
| PATCH | `/:id` | Recruiter/Admin | Update status / notes |
| DELETE | `/:id` | Recruiter/Admin | Delete |

### Distribution — `/api/distribution`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/boards` | Recruiter/Admin | Board catalog |
| GET | `/` | Recruiter/Admin | Distribution records |
| GET | `/job/:jobId` | Owner/Admin | Per-job board status |
| POST | `/publish` | Owner/Admin | Publish to selected boards **(DEMO/MOCK)** |
| POST | `/:id/close` | Owner/Admin | Close on a board **(DEMO/MOCK)** |

### Integrations — `/api/integrations`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/` | Recruiter/Admin | List integrations |
| GET | `/:id` | Recruiter/Admin | Integration detail |
| PATCH | `/:id` | Admin | Toggle enabled / config |
| POST | `/:id/test` | Recruiter/Admin | Test connection **(DEMO)** |
| POST | `/:board/applications` | Public webhook | Inbound application sync **(DEMO)** |
| POST | `/simulate-application` | Recruiter/Admin | Simulate inbound sync |
| GET | `/stats/admin` | Admin | Admin dashboard stats |

### Activity — `/api/activity`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/` | Recruiter/Admin | Activity logs |
| GET | `/integration-logs` | Recruiter/Admin | Publish / sync logs |

## Folder structure (server)

```
server/src/
  config/           # env, db (supports USE_MEMORY_DB)
  constants/        # board catalog
  controllers/      # auth, users, jobs, candidates, distribution, integrations, activity
  integrations/     # adapter pattern (all DEMO/MOCK)
  middleware/       # requireAuth, requireRole, validate
  models/           # User, Job, JobDistribution, Candidate, Integration, ActivityLog
  routes/
  seeders/seed.js
  tests/            # api.smoke.js + run-api-tests.js
  utils/
  validators/
  index.js
```

## Adapter architecture (demo)

```
server/src/integrations/
  base.adapter.js
  mock.adapter.js
  indeed.adapter.js        # DEMO
  linkedin.adapter.js      # DEMO
  monster.adapter.js       # DEMO
  jobstreet.adapter.js     # DEMO
  kalibrr.adapter.js       # DEMO
  generic-feed.adapter.js  # DEMO
  integration-manager.js
```

Methods: `publishJob`, `updateJob`, `closeJob`, `getApplications`, `testConnection`

## What is mocked

- All job board publish / update / close / connection tests
- Simulated latency and occasional demo failures
- Generated `externalJobId` values
- Inbound application webhooks (simulate endpoint)

## What needs real credentials later

- Indeed, LinkedIn, Monster, Glassdoor, ZipRecruiter partner APIs
- JobStreet / JobsDB / Kalibrr / Naukri / Shine / Foundit / etc.
- Feed upload endpoints for XML/CSV boards

## Run the full stack

```bash
# Terminal 1 — API (needs MongoDB Atlas/local, or set USE_MEMORY_DB=true)
npm run server
npm run seed

# Terminal 2 — React app
npm run client
```

Open http://localhost:5173

Demo logins are pre-filled on the login page (`rita@acmecorp.demo` / `Password123!`).

## Frontend routes

| Area | Paths |
|------|-------|
| Public | `/`, `/login`, `/register`, `/jobs`, `/jobs/:id`, `/jobs/:id/apply` |
| Recruiter | `/app`, `/app/jobs`, `/app/jobs/new`, `/app/jobs/:id`, `/app/jobs/:id/distribute`, `/app/candidates`, `/app/candidates/:id`, `/app/integrations`, `/app/activity`, `/app/settings` |
| Admin | `/admin`, `/admin/users`, `/admin/recruiters`, `/admin/jobs`, `/admin/candidates`, `/admin/boards`, `/admin/logs`, `/admin/settings` |

## Deployment notes

See earlier sections for adapter architecture and mocked integrations. For Vercel: deploy the Vite `client` as the frontend and host the Express `server` separately (or as a serverless/API service) with `MONGODB_URI` and `JWT_SECRET` set.
