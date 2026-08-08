import { Router } from 'express';
import {
  listBoards,
  getJobDistribution,
  getJobPublishHistory,
  publishToBoards,
  listDistributions,
  closeDistribution,
} from '../controllers/distribution.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { distributeJobRules, mongoIdParam } from '../validators/index.js';
import { param } from 'express-validator';

const router = Router();

router.use(requireAuth, requireRole('admin', 'recruiter'));

router.get('/boards', listBoards);
router.get('/', listDistributions);
router.get(
  '/job/:jobId/history',
  param('jobId').isMongoId().withMessage('Invalid job id'),
  validate,
  getJobPublishHistory
);
router.get(
  '/job/:jobId',
  param('jobId').isMongoId().withMessage('Invalid job id'),
  validate,
  getJobDistribution
);
router.post('/publish', distributeJobRules, validate, publishToBoards);
router.post('/:id/close', mongoIdParam, validate, closeDistribution);

export default router;
