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

export const publicWriteRateLimiter = rateLimit({
  windowMs: config.publicRateLimit.windowMs,
  max: config.publicRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    errors: [],
  },
});

/**
 * POST /api/auth/register
 * Public registration defaults to candidate.
 * Recruiter self-signup is only allowed when demo/public recruiter signup is enabled.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'candidate', company = '' } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, 'Email already registered', 409);
  }

  let safeRole = 'candidate';
  if (role === 'recruiter') {
    if (!config.allowPublicRecruiterSignup) {
      return sendError(
        res,
        'Recruiter accounts can only be created by an administrator',
        403
      );
    }
    safeRole = 'recruiter';
  } else if (role === 'candidate') {
    safeRole = 'candidate';
  }
  // Never allow public self-elevation to admin

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

  // Always compare to reduce user-enumeration timing differences
  const match = await comparePassword(password, user?.password);
  if (!user || !match) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
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
