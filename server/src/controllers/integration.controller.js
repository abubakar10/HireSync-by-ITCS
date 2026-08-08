import {
  Integration,
  ActivityLog,
  User,
  Job,
  Candidate,
} from '../models/index.js';
import integrationManager from '../integrations/integration-manager.js';
import { logActivity, asyncHandler } from '../utils/helpers.js';
import { sendSuccess, sendError, AppError } from '../utils/response.js';
import {
  processInboundApplication,
  listSimulateOptions,
  pickDemoApplicant,
  normalizeBoardName,
} from '../services/inbound-application.service.js';

/**
 * GET /api/integrations
 */
export const listIntegrations = asyncHandler(async (_req, res) => {
  const integrations = await Integration.find().sort({ name: 1 });
  return sendSuccess(res, { integrations, isDemo: true });
});

/**
 * GET /api/integrations/:id
 */
export const getIntegration = asyncHandler(async (req, res) => {
  const integration = await Integration.findById(req.params.id);
  if (!integration) return sendError(res, 'Integration not found', 404);
  return sendSuccess(res, { integration, isDemo: true });
});

/**
 * PATCH /api/integrations/:id — toggle enabled / update demo config
 */
export const updateIntegration = asyncHandler(async (req, res) => {
  const integration = await Integration.findById(req.params.id);
  if (!integration) return sendError(res, 'Integration not found', 404);

  if (req.body.enabled !== undefined) integration.enabled = req.body.enabled;
  if (req.body.status !== undefined) integration.status = req.body.status;
  if (req.body.configuration !== undefined) {
    integration.configuration = {
      ...integration.configuration,
      ...req.body.configuration,
    };
  }

  if (req.body.enabled === true && integration.status === 'not_connected') {
    integration.status = 'connected';
  }
  if (req.body.enabled === false && integration.status === 'connected') {
    integration.status = 'not_connected';
  }

  await integration.save();

  await logActivity({
    userId: req.user._id,
    action: 'integration.update',
    entity: 'Integration',
    entityId: integration._id,
    board: integration.name,
    details: { enabled: integration.enabled, status: integration.status, isDemo: true },
    status: 'success',
  });

  return sendSuccess(res, { integration, isDemo: true }, 'Integration updated');
});

/**
 * POST /api/integrations/:id/test — demo connection test
 */
export const testIntegration = asyncHandler(async (req, res) => {
  const integration = await Integration.findById(req.params.id);
  if (!integration) return sendError(res, 'Integration not found', 404);

  const result = await integrationManager.testConnection(integration.name);

  integration.lastSyncAt = new Date();
  if (result.success) {
    integration.lastError = null;
    if (integration.status === 'error' || integration.status === 'pending') {
      integration.status = 'connected';
    }
  } else {
    integration.lastError = result.message;
    integration.status = 'error';
  }
  await integration.save();

  await logActivity({
    userId: req.user._id,
    action: 'Connection Test',
    entity: 'Integration',
    entityId: integration._id,
    board: integration.name,
    status: result.success ? 'success' : 'failed',
    response: result.message,
    durationMs: result.durationMs,
    details: { isDemo: true },
  });

  return sendSuccess(res, { result, integration, isDemo: true }, result.message);
});

/**
 * POST /api/integrations/:board/applications
 * Inbound webhook from a job board (DEMO — mock payload accepted).
 *
 * Example:
 * POST /api/integrations/Indeed/applications
 * {
 *   "externalJobId": "indeed-demo-123",
 *   "name": "John Smith",
 *   "email": "john@example.com",
 *   "phone": "+123456789",
 *   "resumeUrl": "...",
 *   "coverLetter": "..."
 * }
 */
export const inboundApplication = asyncHandler(async (req, res) => {
  try {
    const result = await processInboundApplication({
      boardParam: req.params.board,
      payload: req.body,
      actorUserId: req.user?._id || null,
      simulated: false,
    });

    return sendSuccess(res, result, result.message, 201);
  } catch (err) {
    if (err instanceof AppError || err.statusCode) {
      return sendError(res, err.message, err.statusCode || 500, err.errors || []);
    }
    throw err;
  }
});

/**
 * GET /api/integrations/simulate-options
 * Published distributions + demo applicant presets for the admin simulator UI.
 */
export const getSimulateOptions = asyncHandler(async (_req, res) => {
  const data = await listSimulateOptions();
  return sendSuccess(res, data, 'Simulate options loaded');
});

/**
 * POST /api/integrations/simulate-application
 * Admin/recruiter helper — demonstrates inbound webhook without real board credentials.
 */
export const simulateApplication = asyncHandler(async (req, res) => {
  let {
    board,
    externalJobId,
    name,
    email,
    phone,
    resumeUrl,
    coverLetter,
    useRandomApplicant = false,
  } = req.body;

  const options = await listSimulateOptions();

  if (!options.options.length) {
    return sendError(
      res,
      'No published board distributions found. Publish a job to at least one board first, then simulate an application.',
      400
    );
  }

  // Resolve target distribution
  let target = null;
  if (externalJobId) {
    target = options.options.find((o) => o.externalJobId === externalJobId);
  }
  if (!target && board) {
    const normalized = normalizeBoardName(board);
    target = options.options.find((o) => o.board === normalized);
  }
  if (!target) {
    target = options.options[0];
  }

  const demo = useRandomApplicant || !name ? pickDemoApplicant() : null;

  try {
    const result = await processInboundApplication({
      boardParam: board || target.board,
      payload: {
        externalJobId: target.externalJobId,
        name: name || demo.name,
        email: email || demo.email,
        phone: phone || demo.phone,
        resumeUrl: resumeUrl || demo.resumeUrl,
        coverLetter:
          coverLetter ||
          demo.coverLetter ||
          `I am applying for ${target.job.title} at ${target.job.company}. (Demo simulated application)`,
      },
      actorUserId: req.user?._id || null,
      simulated: true,
    });

    return sendSuccess(
      res,
      {
        ...result,
        webhookPath: `/api/integrations/${encodeURIComponent(result.distribution.board)}/applications`,
        nextSteps: {
          pipelinePath: '/app/candidates',
          message: 'Open the Candidates pipeline — the applicant appears under New with the board source.',
        },
      },
      result.message,
      201
    );
  } catch (err) {
    if (err instanceof AppError || err.statusCode) {
      return sendError(res, err.message, err.statusCode || 500, err.errors || []);
    }
    throw err;
  }
});

/**
 * GET /api/integrations/stats/admin — admin dashboard stats
 */
export const adminDashboardStats = asyncHandler(async (_req, res) => {
  const [
    totalRecruiters,
    totalJobs,
    totalCandidates,
    connectedBoards,
    publishLogs,
    syncLogs,
    recentActivity,
    recentSyncs,
  ] = await Promise.all([
    User.countDocuments({ role: 'recruiter', isActive: true }),
    Job.countDocuments(),
    Candidate.countDocuments(),
    Integration.countDocuments({ status: 'connected' }),
    ActivityLog.find({ action: 'Job Published' }).select('status'),
    ActivityLog.countDocuments({ action: 'Application Sync', status: 'success' }),
    ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('userId', 'name email role'),
    ActivityLog.find({ action: 'Application Sync' })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'name email'),
  ]);

  const publishTotal = publishLogs.length;
  const publishSuccess = publishLogs.filter((l) => l.status === 'success').length;
  const publishingSuccessRate =
    publishTotal === 0 ? 0 : Math.round((publishSuccess / publishTotal) * 100);

  return sendSuccess(res, {
    stats: {
      totalRecruiters,
      totalJobs,
      totalCandidates,
      connectedBoards,
      publishingSuccessRate,
      applicationSyncCount: syncLogs,
    },
    recentActivity,
    recentSyncs,
    isDemo: true,
  });
});
