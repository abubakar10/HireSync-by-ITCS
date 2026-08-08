import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  authRateLimiter,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerRules, loginRules } from '../validators/index.js';

const router = Router();

router.post('/register', authRateLimiter, registerRules, validate, register);
router.post('/login', authRateLimiter, loginRules, validate, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
