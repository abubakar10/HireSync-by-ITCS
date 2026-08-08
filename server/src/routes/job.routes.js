import { Router } from 'express';
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  publishJob,
  deleteJob,
  jobDashboardStats,
} from '../controllers/job.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createJobRules,
  updateJobRules,
  jobQueryRules,
  mongoIdParam,
} from '../validators/index.js';

const router = Router();

router.get(
  '/stats/dashboard',
  requireAuth,
  requireRole('admin', 'recruiter'),
  jobDashboardStats
);
router.get('/', optionalAuth, jobQueryRules, validate, listJobs);
router.get('/:id', optionalAuth, mongoIdParam, validate, getJob);
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'recruiter'),
  createJobRules,
  validate,
  createJob
);
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin', 'recruiter'),
  updateJobRules,
  validate,
  updateJob
);
router.post(
  '/:id/publish',
  requireAuth,
  requireRole('admin', 'recruiter'),
  mongoIdParam,
  validate,
  publishJob
);
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'recruiter'),
  mongoIdParam,
  validate,
  deleteJob
);

export default router;
