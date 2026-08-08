import { Router } from 'express';
import {
  listActivity,
  listIntegrationLogs,
} from '../controllers/activity.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { activityQueryRules } from '../validators/index.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'recruiter'));

router.get('/integration-logs', activityQueryRules, validate, listIntegrationLogs);
router.get('/', activityQueryRules, validate, listActivity);

export default router;
