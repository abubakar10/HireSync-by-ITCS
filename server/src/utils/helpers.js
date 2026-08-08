import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { ActivityLog } from '../models/index.js';

const SALT_ROUNDS = 12;

/** Real bcrypt hash so missing-user login still spends compare time */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('__hiresync_timing_dummy__', SALT_ROUNDS);

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash || DUMMY_PASSWORD_HASH);
};

/**
 * Escape user input before using in MongoDB $regex to reduce ReDoS risk.
 */
export const escapeRegex = (value, maxLen = 80) => {
  if (value == null) return '';
  return String(value)
    .slice(0, maxLen)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/** Coerce query params to plain strings (blocks operator injection objects). */
export const asPlainString = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

export const signToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Fire-and-forget activity log (does not throw to callers).
 */
export const logActivity = async ({
  userId = null,
  action,
  entity,
  entityId = null,
  details = {},
  board = null,
  status = 'info',
  response = null,
  durationMs = null,
}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entity,
      entityId,
      details,
      board,
      status,
      response,
      durationMs,
    });
  } catch (err) {
    console.error('[ActivityLog]', err.message);
  }
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const parsePagination = (query, defaults = { page: 1, limit: 10 }) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaults.limit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
