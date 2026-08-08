import {
  JobDistribution,
  Candidate,
  Job,
  Integration,
  CANDIDATE_SOURCES,
} from '../models/index.js';
import { logActivity } from '../utils/helpers.js';
import { BOARD_CATALOG } from '../constants/boards.js';
import { AppError } from '../utils/response.js';

const DEMO_APPLICANTS = [
  {
    name: 'Maya Santillan',
    emailPrefix: 'maya.santillan',
    phone: '+63 917 555 0142',
    resumeUrl: 'https://example.com/resumes/maya-santillan.pdf',
    coverLetter:
      'I am excited to apply for this role. I have 5+ years of experience shipping product features across React and Node.js teams in Manila and Singapore.',
  },
  {
    name: 'Daniel Okonkwo',
    emailPrefix: 'daniel.okonkwo',
    phone: '+1 415 555 0198',
    resumeUrl: 'https://example.com/resumes/daniel-okonkwo.pdf',
    coverLetter:
      'Your posting matches my background in distributed systems and API design. I previously led backend hiring partnerships with multiple job boards.',
  },
  {
    name: 'Priya Nair',
    emailPrefix: 'priya.nair',
    phone: '+91 98765 44021',
    resumeUrl: 'https://example.com/resumes/priya-nair.pdf',
    coverLetter:
      'I bring strong full-stack experience and enjoy collaborating with recruiters and hiring managers to close roles quickly.',
  },
  {
    name: 'Lucas Mendes',
    emailPrefix: 'lucas.mendes',
    phone: '+65 8123 4490',
    resumeUrl: 'https://example.com/resumes/lucas-mendes.pdf',
    coverLetter:
      'I am available to start within three weeks and have hands-on experience with SaaS recruitment tooling and candidate pipeline workflows.',
  },
  {
    name: 'Aisha Rahman',
    emailPrefix: 'aisha.rahman',
    phone: '+971 50 555 7731',
    resumeUrl: 'https://example.com/resumes/aisha-rahman.pdf',
    coverLetter:
      'Please find my application for this opening. I specialize in frontend engineering and have shipped design systems used by multi-market teams.',
  },
];

export const normalizeBoardName = (boardParam) => {
  if (!boardParam) return null;
  const key = String(boardParam).toLowerCase().replace(/[^a-z0-9]/g, '');
  const fromSources = CANDIDATE_SOURCES.find(
    (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '') === key
  );
  if (fromSources) return fromSources;
  return (
    BOARD_CATALOG.find((b) => b.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key)
      ?.name || null
  );
};

export const pickDemoApplicant = () => {
  const profile = DEMO_APPLICANTS[Math.floor(Math.random() * DEMO_APPLICANTS.length)];
  const stamp = Date.now().toString(36);
  return {
    name: profile.name,
    email: `${profile.emailPrefix}.${stamp}@applicants.demo`,
    phone: profile.phone,
    resumeUrl: profile.resumeUrl,
    coverLetter: profile.coverLetter,
  };
};

export const listSimulateOptions = async () => {
  const distributions = await JobDistribution.find({ status: 'published' })
    .populate('jobId', 'title company location status employmentType')
    .sort({ publishedAt: -1 })
    .limit(50);

  const options = distributions
    .filter((d) => d.jobId && d.externalJobId)
    .map((d) => ({
      distributionId: d._id,
      board: d.board,
      externalJobId: d.externalJobId,
      publishedAt: d.publishedAt,
      lastSyncedAt: d.lastSyncedAt,
      job: {
        id: d.jobId._id,
        title: d.jobId.title,
        company: d.jobId.company,
        location: d.jobId.location,
        status: d.jobId.status,
        employmentType: d.jobId.employmentType,
      },
      isDemo: true,
    }));

  return {
    options,
    applicants: DEMO_APPLICANTS.map((a) => ({
      name: a.name,
      phone: a.phone,
      resumeUrl: a.resumeUrl,
      coverLetter: a.coverLetter,
      emailHint: `${a.emailPrefix}@applicants.demo`,
    })),
    boards: [
      'Indeed',
      'LinkedIn',
      'Monster',
      'JobStreet',
      'Kalibrr',
      'OnlineJobs.ph',
      'JobsDB',
      'PhilJobNet',
    ],
    isDemo: true,
  };
};

/**
 * Core inbound webhook processor.
 * Identifies job via externalJobId, creates candidate with board source,
 * blocks duplicates, writes activity log.
 */
export const processInboundApplication = async ({
  boardParam,
  payload,
  actorUserId = null,
  simulated = false,
}) => {
  const started = Date.now();
  const board = normalizeBoardName(boardParam);

  if (!board || board === 'Direct') {
    throw new AppError(`Unknown job board: ${boardParam}`, 400);
  }

  const {
    externalJobId,
    name,
    email,
    phone = '',
    resumeUrl = '',
    coverLetter = '',
    externalApplicationId = null,
  } = payload;

  if (!externalJobId) {
    throw new AppError('externalJobId is required', 400);
  }
  if (!name?.trim()) {
    throw new AppError('Applicant name is required', 400);
  }
  if (!email?.trim()) {
    throw new AppError('Applicant email is required', 400);
  }

  const distribution = await JobDistribution.findOne({
    externalJobId,
    status: { $in: ['published', 'updated'] },
  });

  if (!distribution) {
    await logActivity({
      userId: actorUserId,
      action: 'Application Sync',
      entity: 'JobDistribution',
      board,
      status: 'failed',
      response: `[DEMO] No published job matched externalJobId ${externalJobId}`,
      details: { externalJobId, board, isDemo: true, simulated },
    });
    throw new AppError(
      `No published job found for externalJobId: ${externalJobId}. Publish the job to ${board} first.`,
      404
    );
  }

  // Soft check: warn in logs if webhook board differs from distribution board
  const boardMismatch = distribution.board !== board;

  const job = await Job.findById(distribution.jobId);
  if (!job) {
    throw new AppError('Linked job not found for this distribution', 404);
  }

  if (job.status === 'archived' || job.status === 'closed') {
    throw new AppError('This job is no longer accepting applications', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (externalApplicationId) {
    const byExternal = await Candidate.findOne({ externalApplicationId });
    if (byExternal) {
      await logActivity({
        userId: actorUserId,
        action: 'Application Sync',
        entity: 'Candidate',
        entityId: byExternal._id,
        board,
        status: 'failed',
        response: '[DEMO] Duplicate externalApplicationId rejected',
        details: {
          email: normalizedEmail,
          externalJobId,
          externalApplicationId,
          jobId: job._id,
          isDemo: true,
          simulated,
        },
      });
      throw new AppError(
        'Duplicate application — this board application ID was already synced',
        409
      );
    }
  }

  const existing = await Candidate.findOne({
    jobId: job._id,
    email: normalizedEmail,
  });

  if (existing) {
    await logActivity({
      userId: actorUserId,
      action: 'Application Sync',
      entity: 'Candidate',
      entityId: existing._id,
      board,
      status: 'failed',
      response: '[DEMO] Duplicate application rejected — email already applied to this job',
      details: {
        email: normalizedEmail,
        externalJobId,
        jobId: job._id,
        jobTitle: job.title,
        existingCandidateId: existing._id,
        isDemo: true,
        simulated,
      },
    });
    throw new AppError(
      'Duplicate application — this email already applied to this job',
      409
    );
  }

  // Realistic processing latency for demo sync
  await new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 450)));

  const sourceBoard = boardMismatch ? distribution.board : board;
  const appId =
    externalApplicationId ||
    `${sourceBoard.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-app-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  const candidate = await Candidate.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    resumeUrl: resumeUrl.trim(),
    coverLetter: coverLetter.trim(),
    source: sourceBoard,
    jobId: job._id,
    status: 'New',
    appliedAt: new Date(),
    externalApplicationId: appId,
    timeline: [
      {
        action: simulated
          ? 'Application simulated from job board webhook'
          : 'Application received from job board webhook',
        toStatus: 'New',
        note: `[DEMO] Inbound ${simulated ? 'simulation' : 'webhook'} from ${sourceBoard}${
          boardMismatch ? ` (requested ${board}, matched distribution on ${distribution.board})` : ''
        }`,
        createdBy: actorUserId || undefined,
      },
    ],
    notes: simulated
      ? [
          {
            text: `[DEMO] Created via Simulate Application — no real ${sourceBoard} credentials used.`,
            createdBy: actorUserId || undefined,
          },
        ]
      : [],
  });

  distribution.lastSyncedAt = new Date();
  await distribution.save();

  await Integration.findOneAndUpdate(
    { name: sourceBoard },
    { lastSyncAt: new Date(), lastError: null }
  );

  const durationMs = Date.now() - started;

  await logActivity({
    userId: actorUserId,
    action: 'Application Sync',
    entity: 'Candidate',
    entityId: candidate._id,
    board: sourceBoard,
    status: 'success',
    response: `[DEMO] Application synced from ${sourceBoard}${simulated ? ' (simulated)' : ''}`,
    durationMs,
    details: {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      source: sourceBoard,
      externalJobId,
      externalApplicationId: appId,
      jobId: job._id,
      jobTitle: job.title,
      company: job.company,
      candidateStatus: 'New',
      isDemo: true,
      simulated,
      mode: 'mock',
    },
  });

  const populated = await Candidate.findById(candidate._id).populate(
    'jobId',
    'title company location status employmentType'
  );

  return {
    candidate: populated,
    job: {
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
    },
    distribution: {
      id: distribution._id,
      board: distribution.board,
      externalJobId: distribution.externalJobId,
    },
    pipelineColumn: 'New',
    durationMs,
    isDemo: true,
    simulated,
    mode: 'mock',
    message: `[DEMO] ${candidate.name} applied to “${job.title}” via ${sourceBoard} and landed in New`,
  };
};

export default {
  processInboundApplication,
  listSimulateOptions,
  pickDemoApplicant,
  normalizeBoardName,
  DEMO_APPLICANTS,
};
