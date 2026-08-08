import { ActivityLog, Job } from '../models/index.js';
import { asyncHandler, parsePagination } from '../utils/helpers.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/activity
 * Filters: board, status, action, entity, dateFrom, dateTo
 */
export const listActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 25 });
  const filter = {};

  if (req.query.board) filter.board = req.query.board;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
  if (req.query.entity) filter.entity = req.query.entity;

  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
  }

  // Recruiters only see activity related to their jobs / themselves
  if (req.user.role === 'recruiter') {
    const jobs = await Job.find({ createdBy: req.user._id }).select('_id');
    const jobIds = jobs.map((j) => j._id);
    const jobIdValues = [...jobIds, ...jobIds.map((id) => id.toString())];
    filter.$or = [
      { userId: req.user._id },
      { entity: 'Job', entityId: { $in: jobIdValues } },
      { entity: 'JobDistribution', entityId: { $exists: true }, 'details.jobId': { $in: jobIdValues } },
      { 'details.jobId': { $in: jobIdValues } },
    ];
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /api/activity/integration-logs
 * Focused view for integration actions
 */
export const listIntegrationLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 25 });

  const integrationActions = [
    'Job Published',
    'Job Closed',
    'Application Sync',
    'Connection Test',
  ];

  const filter = {
    action: { $in: integrationActions },
  };

  if (req.query.board) filter.board = req.query.board;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.action) filter.action = req.query.action;

  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
  }

  // Recruiters only see integration events for their own jobs
  if (req.user.role === 'recruiter') {
    const jobs = await Job.find({ createdBy: req.user._id }).select('_id');
    const jobIds = jobs.map((j) => j._id);
    const jobIdValues = [...jobIds, ...jobIds.map((id) => id.toString())];
    filter.$or = [
      { userId: req.user._id },
      { 'details.jobId': { $in: jobIdValues } },
    ];
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    isDemo: true,
  });
});
