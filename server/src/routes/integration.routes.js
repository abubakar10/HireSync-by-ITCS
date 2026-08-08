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
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  inboundApplicationRules,
  updateIntegrationRules,
  mongoIdParam,
} from '../validators/index.js';

const router = Router();

// Static paths BEFORE /:board and /:id params
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

// Inbound webhook (DEMO) — boards post applications here; JWT optional
router.post(
  '/:board/applications',
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
