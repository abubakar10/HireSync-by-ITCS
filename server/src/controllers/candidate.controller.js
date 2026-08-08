import {
  Candidate,
  Job,
  CANDIDATE_STATUSES,
  CANDIDATE_SOURCES,
} from '../models/index.js';
import {
  logActivity,
  asyncHandler,
  parsePagination,
} from '../utils/helpers.js';
import { sendSuccess, sendError } from '../utils/response.js';

const ownedJobIds = async (user) => {
  if (user.role === 'admin') return null;
  const jobs = await Job.find({ createdBy: user._id }).select('_id');
  return jobs.map((j) => j._id);
};

/**
 * GET /api/candidates
 */
export const listCandidates = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20 });
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.jobId) filter.jobId = req.query.jobId;

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const ids = await ownedJobIds(req.user);
  if (ids) filter.jobId = filter.jobId ? filter.jobId : { $in: ids };
  if (ids && req.query.jobId && !ids.some((id) => id.toString() === req.query.jobId)) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .populate('jobId', 'title company location status')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    Candidate.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    candidates,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /api/candidates/pipeline — kanban columns
 */
export const getPipeline = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.jobId) filter.jobId = req.query.jobId;

  const ids = await ownedJobIds(req.user);
  if (ids) {
    if (req.query.jobId && !ids.some((id) => id.toString() === req.query.jobId)) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    filter.jobId = req.query.jobId || { $in: ids };
  }

  const candidates = await Candidate.find(filter)
    .populate('jobId', 'title company')
    .sort({ appliedAt: -1 });

  const columns = {};
  for (const status of CANDIDATE_STATUSES) {
    columns[status] = [];
  }
  for (const c of candidates) {
    if (columns[c.status]) columns[c.status].push(c);
  }

  return sendSuccess(res, { columns, statuses: CANDIDATE_STATUSES, sources: CANDIDATE_SOURCES });
});

/**
 * GET /api/candidates/:id
 */
export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id)
    .populate('jobId', 'title company location employmentType status createdBy')
    .populate('notes.createdBy', 'name email')
    .populate('timeline.createdBy', 'name email');

  if (!candidate) return sendError(res, 'Candidate not found', 404);

  if (req.user.role === 'recruiter') {
    const job = await Job.findById(candidate.jobId?._id || candidate.jobId);
    if (!job || job.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Insufficient permissions', 403);
    }
  }

  return sendSuccess(res, { candidate });
});

/**
 * POST /api/candidates — recruiter | admin | public apply
 */
export const createCandidate = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.body.jobId);
  if (!job) return sendError(res, 'Job not found', 404);

  if (job.status !== 'published' && (!req.user || req.user.role === 'candidate')) {
    return sendError(res, 'Job is not open for applications', 400);
  }

  const existing = await Candidate.findOne({
    jobId: req.body.jobId,
    email: req.body.email.toLowerCase(),
  });
  if (existing) {
    return sendError(res, 'You have already applied to this job', 409);
  }

  const candidate = await Candidate.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone || '',
    resumeUrl: req.body.resumeUrl || '',
    coverLetter: req.body.coverLetter || '',
    source: req.body.source || 'Direct',
    jobId: req.body.jobId,
    status: 'New',
    appliedAt: new Date(),
    timeline: [
      {
        action: 'Application received',
        toStatus: 'New',
        note: `Applied via ${req.body.source || 'Direct'}`,
        createdBy: req.user?._id || null,
      },
    ],
  });

  await logActivity({
    userId: req.user?._id || null,
    action: 'candidate.apply',
    entity: 'Candidate',
    entityId: candidate._id,
    details: {
      name: candidate.name,
      email: candidate.email,
      source: candidate.source,
      jobId: job._id,
      jobTitle: job.title,
    },
    board: candidate.source !== 'Direct' ? candidate.source : null,
    status: 'success',
  });

  return sendSuccess(res, { candidate }, 'Application submitted', 201);
});

/**
 * PATCH /api/candidates/:id — update status / notes / fields
 */
export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return sendError(res, 'Candidate not found', 404);

  const job = await Job.findById(candidate.jobId);
  if (
    req.user.role === 'recruiter' &&
    (!job || job.createdBy.toString() !== req.user._id.toString())
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const prevStatus = candidate.status;

  if (req.body.name !== undefined) candidate.name = req.body.name;
  if (req.body.email !== undefined) candidate.email = req.body.email;
  if (req.body.phone !== undefined) candidate.phone = req.body.phone;
  if (req.body.resumeUrl !== undefined) candidate.resumeUrl = req.body.resumeUrl;
  if (req.body.coverLetter !== undefined) candidate.coverLetter = req.body.coverLetter;

  if (req.body.status && req.body.status !== prevStatus) {
    if (!CANDIDATE_STATUSES.includes(req.body.status)) {
      return sendError(res, 'Invalid status', 400);
    }
    candidate.status = req.body.status;
    candidate.timeline.push({
      action: 'Status changed',
      fromStatus: prevStatus,
      toStatus: req.body.status,
      note: req.body.note || null,
      createdBy: req.user._id,
    });
  }

  if (req.body.note && !req.body.status) {
    candidate.notes.push({
      text: req.body.note,
      createdBy: req.user._id,
    });
    candidate.timeline.push({
      action: 'Note added',
      note: req.body.note,
      createdBy: req.user._id,
    });
  } else if (req.body.note && req.body.status) {
    candidate.notes.push({
      text: req.body.note,
      createdBy: req.user._id,
    });
  }

  await candidate.save();

  await logActivity({
    userId: req.user._id,
    action: req.body.status ? 'candidate.status_change' : 'candidate.update',
    entity: 'Candidate',
    entityId: candidate._id,
    details: {
      previousStatus: prevStatus,
      status: candidate.status,
      fields: Object.keys(req.body),
    },
    status: 'success',
  });

  const populated = await Candidate.findById(candidate._id)
    .populate('jobId', 'title company')
    .populate('notes.createdBy', 'name email')
    .populate('timeline.createdBy', 'name email');

  return sendSuccess(res, { candidate: populated }, 'Candidate updated');
});

/**
 * DELETE /api/candidates/:id
 */
export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return sendError(res, 'Candidate not found', 404);

  const job = await Job.findById(candidate.jobId);
  if (
    req.user.role === 'recruiter' &&
    (!job || job.createdBy.toString() !== req.user._id.toString())
  ) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  await candidate.deleteOne();

  await logActivity({
    userId: req.user._id,
    action: 'candidate.delete',
    entity: 'Candidate',
    entityId: candidate._id,
    details: { name: candidate.name, email: candidate.email },
    status: 'success',
  });

  return sendSuccess(res, {}, 'Candidate deleted');
});
