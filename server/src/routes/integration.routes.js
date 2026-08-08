import { Router } from 'express';
import {
  listIntegrations,
  getIntegration,
  updateIntegration,
  testIntegration,
  inboundApplication,
  simulateApplication,
  getSimulateOptions,
  adminDashboardStats,
} from '../controllers/integration.controller.js';
import {
  requireAuth,
  requireRole,
  optionalAuth,
  requireWebhookSecret,
} from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { publicWriteRateLimiter } from '../controllers/auth.controller.js';
import {
  inboundApplicationRules,
  updateIntegrationRules,
  mongoIdParam,
} from '../validators/index.js';

const router = Router();

router.get(
  '/stats/admin',
  requireAuth,
  requireRole('admin'),
  adminDashboardStats
);

router.get(
  '/simulate-options',
  requireAuth,
  requireRole('admin', 'recruiter'),
  getSimulateOptions
);

router.post(
  '/simulate-application',
  requireAuth,
  requireRole('admin', 'recruiter'),
  simulateApplication
);

router.post(
  '/:board/applications',
  publicWriteRateLimiter,
  requireWebhookSecret,
  optionalAuth,
  inboundApplicationRules,
  validate,
  inboundApplication
);

router.get('/', requireAuth, requireRole('admin', 'recruiter'), listIntegrations);
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'recruiter'),
  mongoIdParam,
  validate,
  getIntegration
);
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  updateIntegrationRules,
  validate,
  updateIntegration
);
router.post(
  '/:id/test',
  requireAuth,
  requireRole('admin', 'recruiter'),
  mongoIdParam,
  validate,
  testIntegration
);

export default router;
