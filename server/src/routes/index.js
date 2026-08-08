import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import jobRoutes from './job.routes.js';
import candidateRoutes from './candidate.routes.js';
import distributionRoutes from './distribution.routes.js';
import integrationRoutes from './integration.routes.js';
import activityRoutes from './activity.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidates', candidateRoutes);
router.use('/distribution', distributionRoutes);
router.use('/integrations', integrationRoutes);
router.use('/activity', activityRoutes);

export default router;
