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
  escapeRegex,
  asPlainString,
} from '../utils/helpers.js';
import { sendSuccess, sendError } from '../utils/response.js';

const ownedJobIds = async (user) => {
  if (user.role === 'admin') return null;
  const jobs = await Job.find({ createdBy: user._id }).select('_id');
  return jobs.map((j) => j._id);
};

/**
 * GET /api/candidates/sources — canonical source list from Candidate model
 */
export const listSources = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { sources: CANDIDATE_SOURCES });
});

/**
 * GET /api/candidates
 */
export const listCandidates = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { page: 1, limit: 20 });
  const filter = {};

  const status = asPlainString(req.query.status);
  const source = asPlainString(req.query.source);
  const jobId = asPlainString(req.query.jobId);
  const search = asPlainString(req.query.search);

  if (status) filter.status = status;
  if (source) filter.source = source;
  if (jobId) filter.jobId = jobId;

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }

  const ids = await ownedJobIds(req.user);
  if (ids) filter.jobId = filter.jobId ? filter.jobId : { $in: ids };
  if (ids && jobId && !ids.some((id) => id.toString() === jobId)) {
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
    sources: CANDIDATE_SOURCES,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /api/candidates/pipeline — kanban columns
 */
export const getPipeline = asyncHandler(async (req, res) => {
  const filter = {};
  const jobId = asPlainString(req.query.jobId);
  const source = asPlainString(req.query.source);
  if (jobId) filter.jobId = jobId;
  if (source) filter.source = source;

  const ids = await ownedJobIds(req.user);
  if (ids) {
    if (jobId && !ids.some((id) => id.toString() === jobId)) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    filter.jobId = jobId || { $in: ids };
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

  const isRecruiter = req.user?.role === 'recruiter';
  const isAdmin = req.user?.role === 'admin';
  const isPublicOrCandidate = !req.user || req.user.role === 'candidate';

  if (isRecruiter && job.createdBy.toString() !== req.user._id.toString()) {
    return sendError(res, 'Insufficient permissions', 403);
  }

  if (isPublicOrCandidate && job.status !== 'published') {
    return sendError(res, 'Job is not open for applications', 400);
  }

  if (isRecruiter && job.status !== 'published' && job.status !== 'draft') {
    return sendError(res, 'Cannot add candidates to a closed or archived job', 400);
  }

  const existing = await Candidate.findOne({
    jobId: req.body.jobId,
    email: req.body.email.toLowerCase(),
  });
  if (existing) {
    return sendError(res, 'You have already applied to this job', 409);
  }

  // Public/candidate applies are always Direct — do not trust client-supplied board sources
  let source = 'Direct';
  if (isAdmin || isRecruiter) {
    source = req.body.source || 'Direct';
  }

  const candidate = await Candidate.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone || '',
    resumeUrl: req.body.resumeUrl || '',
    coverLetter: (req.body.coverLetter || '').slice(0, 10000),
    source,
    jobId: req.body.jobId,
    status: 'New',
    appliedAt: new Date(),
    timeline: [
      {
        action: 'Application received',
        toStatus: 'New',
        note: `Applied via ${source}`,
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
      source: candidate.source,
      jobId: job._id.toString(),
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
