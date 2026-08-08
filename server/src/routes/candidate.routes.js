import { Router } from 'express';
import {
  listCandidates,
  getPipeline,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../controllers/candidate.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCandidateRules,
  updateCandidateRules,
  mongoIdParam,
} from '../validators/index.js';

const router = Router();

// Public / candidate apply
router.post('/', optionalAuth, createCandidateRules, validate, createCandidate);

router.use(requireAuth, requireRole('admin', 'recruiter'));

router.get('/pipeline', getPipeline);
router.get('/', listCandidates);
router.get('/:id', mongoIdParam, validate, getCandidate);
router.patch('/:id', updateCandidateRules, validate, updateCandidate);
router.delete('/:id', mongoIdParam, validate, deleteCandidate);

export default router;
