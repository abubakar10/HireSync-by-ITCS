import { Job, Candidate } from '../models/index.js';
import {
  logActivity,
  asyncHandler,
  parsePagination,
} from '../utils/helpers.js';
import { sendSuccess, sendError } from '../utils/response.js';

const buildJobFilter = (query, user) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.location) filter.location = { $regex: query.location, $options: 'i' };
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.company) filter.company = { $regex: query.company, $options: 'i' };

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { company: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Recruiters only see their own jobs; admins see all
  if (user?.role === 'recruiter') {
    filter.createdBy = user._id;
  }

  return filter;
};

const sortMap = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
};

/**
 * GET /api/jobs
 * Public can list published only; recruiter/admin see filtered set.
 */
export const listJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = buildJobFilter(req.query, req.user);

  // Unauthenticated or candidate: only published
  if (!req.user || req.user.role === 'candidate') {
    filter.status = 'published';
  }

  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('createdBy', 'name email company')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    jobs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /api/jobs/:id
 */
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    'createdBy',
    'name email company'
  );
  if (!job) return sendError(res, 'Job not found', 404);

  const isPublished = job.status === 'published';
  const isAdmin = req.user?.role === 'admin';
  const isOwner =
    req.user?.role === 'recruiter' &&
    job.createdBy?._id?.toString() === req.user._id.toString();

  if (!isPublished && !isAdmin && !isOwner) {
    return sendError(res, 'Job not found', 404);
  }

  return sendSuccess(res, { job });
});

/**
 * POST /api/jobs — recruiter | admin
 */
export const createJob = asyncHandler(async (req, res) => {
  const payload = {
    title: req.body.title,
    description: req.body.description,
    company: req.body.company || req.user.company || '',
    location: req.body.location,
    employmentType: req.body.employmentType || 'Full-time',
    salaryMin: req.body.salaryMin ?? 0,
    salaryMax: req.body.salaryMax ?? 0,
    currency: (req.body.currency || 'USD').toUpperCase(),
    skills: req.body.skills || [],
    status: req.body.status || 'draft',
    createdBy: req.user._id,
  };

  if (payload.status === 'published') {
    payload.publishedAt = new Date();
  }

  const job = await Job.create(payload);

  await logActivity({
    userId: req.user._id,
    action: payload.status === 'published' ? 'job.publish' : 'job.create',
    entity: 'Job',
    entityId: job._id,
    details: { title: job.title, status: job.status },
    status: 'success',
  });

  return sendSuccess(res, { job }, 'Job created', 201);
});

/**
 * PATCH /api/jobs/:id — recruiter (owner) | admin
 */
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found', 404);

  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const fields = [
    'title',
    'description',
    'company',
    'location',
    'employmentType',
    'salaryMin',
    'salaryMax',
    'currency',
    'skills',
    'status',
  ];

  const prevStatus = job.status;

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      job[field] = field === 'currency' ? String(req.body[field]).toUpperCase() : req.body[field];
    }
  }

  if (job.status === 'published' && prevStatus !== 'published') {
    job.publishedAt = new Date();
  }

  await job.save();

  await logActivity({
    userId: req.user._id,
    action: job.status === 'published' && prevStatus !== 'published' ? 'job.publish' : 'job.update',
    entity: 'Job',
    entityId: job._id,
    details: { title: job.title, status: job.status, previousStatus: prevStatus },
    status: 'success',
  });

  return sendSuccess(res, { job }, 'Job updated');
});

/**
 * POST /api/jobs/:id/publish — recruiter | admin
 */
export const publishJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found', 404);

  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  job.status = 'published';
  job.publishedAt = new Date();
  await job.save();

  await logActivity({
    userId: req.user._id,
    action: 'job.publish',
    entity: 'Job',
    entityId: job._id,
    details: { title: job.title },
    status: 'success',
  });

  return sendSuccess(res, { job }, 'Job published');
});

/**
 * DELETE /api/jobs/:id — soft archive
 */
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found', 404);

  if (
    req.user.role === 'recruiter' &&
    job.createdBy.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  job.status = 'archived';
  await job.save();

  await logActivity({
    userId: req.user._id,
    action: 'job.archive',
    entity: 'Job',
    entityId: job._id,
    details: { title: job.title },
    status: 'success',
  });

  return sendSuccess(res, { job }, 'Job archived');
});

/**
 * GET /api/jobs/stats/dashboard — recruiter | admin
 */
export const jobDashboardStats = asyncHandler(async (req, res) => {
  const jobFilter =
    req.user.role === 'recruiter' ? { createdBy: req.user._id } : {};

  const jobIds =
    req.user.role === 'recruiter'
      ? (await Job.find(jobFilter).select('_id')).map((j) => j._id)
      : null;

  const candidateFilter = jobIds ? { jobId: { $in: jobIds } } : {};

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalJobs,
    activeJobs,
    jobsPublished,
    totalCandidates,
    candidatesThisMonth,
    applicationsToday,
    jobsByStatus,
    candidatesBySource,
    applicationsOverTime,
  ] = await Promise.all([
    Job.countDocuments(jobFilter),
    Job.countDocuments({ ...jobFilter, status: 'published' }),
    Job.countDocuments({ ...jobFilter, status: 'published' }),
    Candidate.countDocuments(candidateFilter),
    Candidate.countDocuments({
      ...candidateFilter,
      appliedAt: { $gte: startOfMonth },
    }),
    Candidate.countDocuments({
      ...candidateFilter,
      appliedAt: { $gte: startOfDay },
    }),
    Job.aggregate([
      { $match: jobFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Candidate.aggregate([
      { $match: candidateFilter },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Candidate.aggregate([
      {
        $match: {
          ...candidateFilter,
          appliedAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return sendSuccess(res, {
    stats: {
      totalJobs,
      activeJobs,
      totalCandidates,
      candidatesThisMonth,
      jobsPublished,
      applicationsToday,
    },
    charts: {
      jobsByStatus: jobsByStatus.map((r) => ({ status: r._id, count: r.count })),
      candidatesBySource: candidatesBySource.map((r) => ({
        source: r._id,
        count: r.count,
      })),
      applicationsOverTime: applicationsOverTime.map((r) => ({
        date: r._id,
        count: r.count,
      })),
    },
  });
});
