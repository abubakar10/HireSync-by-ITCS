import {
  Job,
  JobDistribution,
  Integration,
  ActivityLog,
  JOB_BOARDS,
} from '../models/index.js';
import integrationManager from '../integrations/integration-manager.js';
import {
  logActivity,
  asyncHandler,
  parsePagination,
} from '../utils/helpers.js';
import { sendSuccess, sendError } from '../utils/response.js';

const PRIMARY_DEMO_BOARDS = new Set(integrationManager.primaryDemoBoards());

/**
 * GET /api/distribution/boards — catalog of boards + adapter metadata
 */
export const listBoards = asyncHandler(async (_req, res) => {
  const integrations = await Integration.find().sort({ name: 1 });
  const adapters = integrationManager.list();

  const boards = JOB_BOARDS.map((name) => {
    const integration = integrations.find((i) => i.name === name);
    const adapter = adapters.find((a) => a.name === name);
    return {
      name,
      type: integration?.type || adapter?.type || 'API',
      region: integration?.region || adapter?.region || 'Global',
      status: integration?.status || 'available',
      enabled: integration?.enabled ?? false,
      isDemo: true,
      mode: 'mock',
      primary: PRIMARY_DEMO_BOARDS.has(name),
      lastSyncAt: integration?.lastSyncAt || null,
      integrationId: integration?._id || null,
      disclaimer: 'Mock adapter — not connected to a live job board API',
    };
  });

  return sendSuccess(res, { boards, isDemo: true });
});

/**
 * GET /api/distribution/job/:jobId — distribution status per board for a job
 */
export const getJobDistribution = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return sendError(res, 'Job not found', 404);

  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const distributions = await JobDistribution.find({ jobId: job._id });
  const integrations = await Integration.find().sort({ name: 1 });
  const adapters = integrationManager.list();

  const boards = JOB_BOARDS.map((name) => {
    const dist = distributions.find((d) => d.board === name);
    const integration = integrations.find((i) => i.name === name);
    const adapter = adapters.find((a) => a.name === name);
    return {
      name,
      type: integration?.type || adapter?.type || 'API',
      region: integration?.region || adapter?.region || 'Global',
      connectionStatus: integration?.status || 'available',
      enabled: integration?.enabled ?? false,
      publishedStatus: dist?.status || 'not_published',
      externalJobId: dist?.externalJobId || null,
      publishedAt: dist?.publishedAt || null,
      lastSyncedAt: dist?.lastSyncedAt || null,
      errorMessage: dist?.errorMessage || null,
      durationMs: dist?.durationMs || null,
      distributionId: dist?._id || null,
      isDemo: true,
      mode: 'mock',
      primary: PRIMARY_DEMO_BOARDS.has(name),
      disclaimer: 'Mock adapter — DEMO only',
    };
  });

  return sendSuccess(res, {
    job,
    boards,
    primaryBoards: integrationManager.primaryDemoBoards(),
    isDemo: true,
  });
});

/**
 * GET /api/distribution/job/:jobId/history — publishing history for a job
 */
export const getJobPublishHistory = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return sendError(res, 'Job not found', 404);

  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 30 });

  const filter = {
    action: { $in: ['Job Published', 'Job Closed'] },
    $or: [
      { 'details.jobId': job._id },
      { 'details.jobId': job._id.toString() },
    ],
  };

  const [logs, total, distributions] = await Promise.all([
    ActivityLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
    JobDistribution.find({ jobId: job._id }).sort({ updatedAt: -1 }),
  ]);

  const history = logs.map((log) => ({
    id: log._id,
    timestamp: log.createdAt,
    action: log.action,
    board: log.board,
    status: log.status,
    response: log.response,
    durationMs: log.durationMs,
    externalJobId: log.details?.externalJobId || null,
    jobTitle: log.details?.jobTitle || job.title,
    user: log.userId,
    isDemo: true,
  }));

  return sendSuccess(res, {
    history,
    distributions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    isDemo: true,
  });
});

/**
 * POST /api/distribution/publish
 * Body: { jobId, boards: string[] }
 * Uses mock adapters — clearly demo. Never calls real job board APIs.
 */
export const publishToBoards = asyncHandler(async (req, res) => {
  const { jobId, boards } = req.body;

  const job = await Job.findById(jobId);
  if (!job) return sendError(res, 'Job not found', 404);

  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  if (job.status === 'draft') {
    job.status = 'published';
    job.publishedAt = new Date();
    await job.save();
  }

  if (job.status === 'archived' || job.status === 'closed') {
    return sendError(res, 'Cannot distribute a closed or archived job', 400);
  }

  const results = [];

  for (const board of boards) {
    const started = Date.now();

    let dist = await JobDistribution.findOne({ jobId: job._id, board });
    if (!dist) {
      dist = new JobDistribution({ jobId: job._id, board, status: 'pending' });
    } else {
      dist.status = 'pending';
      dist.errorMessage = null;
    }
    await dist.save();

    const result = await integrationManager.publishJob(board, job.toObject());
    const durationMs = result.durationMs ?? Date.now() - started;

    if (result.success) {
      dist.status = 'published';
      dist.externalJobId = result.externalJobId;
      dist.publishedAt = new Date();
      dist.lastSyncedAt = new Date();
      dist.errorMessage = null;
      dist.responsePayload = result.raw || { message: result.message, demo: true };
      dist.durationMs = durationMs;
    } else {
      dist.status = 'failed';
      dist.errorMessage = result.message;
      dist.durationMs = durationMs;
      dist.responsePayload = { message: result.message, demo: true, mode: 'mock' };
    }
    await dist.save();

    await Integration.findOneAndUpdate(
      { name: board },
      { lastSyncAt: new Date() }
    );

    await logActivity({
      userId: req.user._id,
      action: 'Job Published',
      entity: 'JobDistribution',
      entityId: dist._id,
      details: {
        jobId: job._id,
        jobTitle: job.title,
        board,
        externalJobId: dist.externalJobId,
        isDemo: true,
        mode: 'mock',
      },
      board,
      status: result.success ? 'success' : 'failed',
      response: result.message,
      durationMs,
    });

    results.push({
      board,
      success: result.success,
      status: dist.status,
      externalJobId: dist.externalJobId,
      message: result.message,
      durationMs,
      isDemo: true,
      mode: 'mock',
    });
  }

  const successCount = results.filter((r) => r.success).length;

  return sendSuccess(
    res,
    { results, job, isDemo: true, mode: 'mock' },
    `[DEMO] Published to ${successCount}/${results.length} boards via mock adapters`
  );
});

/**
 * GET /api/distribution — list all distribution records
 */
export const listDistributions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (req.query.board) filter.board = req.query.board;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.jobId) filter.jobId = req.query.jobId;

  if (req.user.role === 'recruiter') {
    const jobs = await Job.find({ createdBy: req.user._id }).select('_id');
    filter.jobId = { $in: jobs.map((j) => j._id) };
  }

  const [distributions, total] = await Promise.all([
    JobDistribution.find(filter)
      .populate('jobId', 'title company status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    JobDistribution.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    distributions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    isDemo: true,
  });
});

/**
 * POST /api/distribution/:id/close — close on a board (demo)
 */
export const closeDistribution = asyncHandler(async (req, res) => {
  const dist = await JobDistribution.findById(req.params.id).populate('jobId');
  if (!dist) return sendError(res, 'Distribution record not found', 404);

  const job = dist.jobId;
  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const result = await integrationManager.closeJob(dist.board, dist.externalJobId);

  dist.status = result.success ? 'closed' : 'failed';
  if (!result.success) dist.errorMessage = result.message;
  dist.lastSyncedAt = new Date();
  await dist.save();

  await logActivity({
    userId: req.user._id,
    action: 'Job Closed',
    entity: 'JobDistribution',
    entityId: dist._id,
    board: dist.board,
    status: result.success ? 'success' : 'failed',
    response: result.message,
    durationMs: result.durationMs,
    details: {
      jobId: job._id,
      jobTitle: job.title,
      externalJobId: dist.externalJobId,
      isDemo: true,
      mode: 'mock',
    },
  });

  return sendSuccess(res, { distribution: dist, isDemo: true }, result.message);
});
