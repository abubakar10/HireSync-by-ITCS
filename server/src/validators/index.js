import { body, param, query } from 'express-validator';
import { CANDIDATE_STATUSES, CANDIDATE_SOURCES, JOB_BOARDS } from '../models/index.js';

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'recruiter', 'candidate'])
    .withMessage('Invalid role'),
  body('company').optional().trim().isLength({ max: 200 }),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'recruiter', 'candidate']).withMessage('Invalid role'),
  body('company').optional().trim(),
];

export const updateUserRules = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('name').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'recruiter', 'candidate']),
  body('company').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('password').optional().isLength({ min: 6 }),
];

export const createJobRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('employmentType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']),
  body('salaryMin').optional().isFloat({ min: 0 }),
  body('salaryMax').optional().isFloat({ min: 0 }),
  body('currency').optional().trim().isLength({ min: 3, max: 3 }),
  body('skills').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'closed', 'archived']),
];

export const updateJobRules = [
  param('id').isMongoId().withMessage('Invalid job id'),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().notEmpty(),
  body('company').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
  body('employmentType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']),
  body('salaryMin').optional().isFloat({ min: 0 }),
  body('salaryMax').optional().isFloat({ min: 0 }),
  body('currency').optional().trim().isLength({ min: 3, max: 3 }),
  body('skills').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'closed', 'archived']),
];

export const jobQueryRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'published', 'closed', 'archived']),
  query('employmentType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']),
  query('location').optional().trim(),
  query('search').optional().trim(),
  query('sort').optional().isIn(['newest', 'oldest', 'title']),
];

export const createCandidateRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('resumeUrl').optional().trim(),
  body('coverLetter').optional().trim(),
  body('source').optional().isIn(CANDIDATE_SOURCES),
  body('jobId').isMongoId().withMessage('Valid jobId is required'),
  body('status').optional().isIn(CANDIDATE_STATUSES),
];

export const updateCandidateRules = [
  param('id').isMongoId().withMessage('Invalid candidate id'),
  body('name').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('resumeUrl').optional().trim(),
  body('coverLetter').optional().trim(),
  body('status').optional().isIn(CANDIDATE_STATUSES),
  body('note').optional().trim(),
];

export const inboundApplicationRules = [
  param('board').trim().notEmpty().withMessage('Board is required'),
  body('externalJobId').trim().notEmpty().withMessage('externalJobId is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('resumeUrl').optional().trim(),
  body('coverLetter').optional().trim(),
];

export const distributeJobRules = [
  body('jobId').isMongoId().withMessage('Valid jobId is required'),
  body('boards')
    .isArray({ min: 1 })
    .withMessage('Select at least one board'),
  body('boards.*').isIn(JOB_BOARDS).withMessage('Invalid board name'),
];

export const mongoIdParam = [param('id').isMongoId().withMessage('Invalid id')];

export const activityQueryRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('board').optional().trim(),
  query('status').optional().isIn(['success', 'failed', 'pending', 'info']),
  query('action').optional().trim(),
  query('entity').optional().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
];

export const updateIntegrationRules = [
  param('id').isMongoId().withMessage('Invalid integration id'),
  body('enabled').optional().isBoolean(),
  body('status')
    .optional()
    .isIn(['connected', 'not_connected', 'available', 'error', 'pending']),
  body('configuration').optional().isObject(),
];
