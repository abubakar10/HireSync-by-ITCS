import rateLimit from 'express-rate-limit';
import { User } from '../models/index.js';
import config from '../config/index.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  logActivity,
  asyncHandler,
} from '../utils/helpers.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authRateLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  max: config.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts. Please try again later.',
    errors: [],
  },
});

/**
 * POST /api/auth/register
 * Public registration. Default role = candidate.
 * Admin/recruiter creation should go through /api/users (admin only),
 * but demo allows recruiter self-register for convenience.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'candidate', company = '' } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, 'Email already registered', 409);
  }

  // Prevent public self-elevation to admin
  const safeRole = role === 'admin' ? 'candidate' : role;

  const hashed = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: safeRole,
    company,
  });

  const token = signToken(user);

  await logActivity({
    userId: user._id,
    action: 'user.register',
    entity: 'User',
    entityId: user._id,
    details: { email: user.email, role: user.role },
    status: 'success',
  });

  return sendSuccess(
    res,
    { user, token },
    'Registration successful',
    201
  );
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    return sendError(res, 'Account is inactive', 403);
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const token = signToken(user);
  user.password = undefined;

  await logActivity({
    userId: user._id,
    action: 'user.login',
    entity: 'User',
    entityId: user._id,
    details: { email: user.email },
    status: 'success',
  });

  return sendSuccess(res, { user, token }, 'Login successful');
});

/**
 * POST /api/auth/logout
 * Stateless JWT — client discards token. Logged for audit.
 */
export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await logActivity({
      userId: req.user._id,
      action: 'user.logout',
      entity: 'User',
      entityId: req.user._id,
      status: 'success',
    });
  }
  return sendSuccess(res, {}, 'Logged out successfully');
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Current user');
});
