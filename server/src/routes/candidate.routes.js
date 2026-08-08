import { Router } from 'express';
import {
  listCandidates,
  getPipeline,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  listSources,
} from '../controllers/candidate.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { publicWriteRateLimiter } from '../controllers/auth.controller.js';
import {
  createCandidateRules,
  updateCandidateRules,
  candidateQueryRules,
  mongoIdParam,
} from '../validators/index.js';

const router = Router();

// Public / candidate apply
router.post(
  '/',
  publicWriteRateLimiter,
  optionalAuth,
  createCandidateRules,
  validate,
  createCandidate
);

router.use(requireAuth, requireRole('admin', 'recruiter'));

router.get('/sources', listSources);
router.get('/pipeline', candidateQueryRules, validate, getPipeline);
router.get('/', candidateQueryRules, validate, listCandidates);
router.get('/:id', mongoIdParam, validate, getCandidate);
router.patch('/:id', updateCandidateRules, validate, updateCandidate);
router.delete('/:id', mongoIdParam, validate, deleteCandidate);

export default router;
