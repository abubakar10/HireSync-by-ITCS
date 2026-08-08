import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import config from '../config/index.js';
import { sendError } from '../utils/response.js';

/**
 * Require a valid JWT. Attaches user to req.user (password excluded).
 */
export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = header.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    next(error);
  }
};

/**
 * Require one or more roles. Use after requireAuth.
 * Example: requireRole('admin'), requireRole('admin', 'recruiter')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Optional auth — attaches user if token present, otherwise continues.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (user?.isActive) {
        req.user = user;
      }
    }
  } catch {
    // ignore invalid optional tokens
  }
  next();
};
