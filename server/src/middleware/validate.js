import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Run after express-validator chains.
 * Returns 400 with field errors if validation fails.
 */
export const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return sendError(res, 'Validation failed', 400, errors);
  }
  next();
};
