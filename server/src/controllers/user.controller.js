import { User } from '../models/index.js';
import {
  hashPassword,
  logActivity,
  asyncHandler,
  parsePagination,
} from '../utils/helpers.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/users — admin
 */
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /api/users/:id — admin
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user });
});

/**
 * POST /api/users — admin create user (any role)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, company = '' } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already registered', 409);

  const hashed = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
    company,
  });

  await logActivity({
    userId: req.user._id,
    action: 'user.create',
    entity: 'User',
    entityId: user._id,
    details: { email, role },
    status: 'success',
  });

  return sendSuccess(res, { user }, 'User created', 201);
});

/**
 * PATCH /api/users/:id — admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return sendError(res, 'User not found', 404);

  const { name, email, role, company, isActive, password } = req.body;

  if (email && email !== user.email) {
    const taken = await User.findOne({ email });
    if (taken) return sendError(res, 'Email already in use', 409);
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (company !== undefined) user.company = company;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = await hashPassword(password);

  await user.save();
  user.password = undefined;

  await logActivity({
    userId: req.user._id,
    action: 'user.update',
    entity: 'User',
    entityId: user._id,
    details: { fields: Object.keys(req.body) },
    status: 'success',
  });

  return sendSuccess(res, { user }, 'User updated');
});

/**
 * DELETE /api/users/:id — admin (soft deactivate)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);

  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 'Cannot deactivate your own account', 400);
  }

  user.isActive = false;
  await user.save();

  await logActivity({
    userId: req.user._id,
    action: 'user.deactivate',
    entity: 'User',
    entityId: user._id,
    status: 'success',
  });

  return sendSuccess(res, { user }, 'User deactivated');
});

/**
 * GET /api/users/recruiters — admin
 */
export const listRecruiters = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { role: 'recruiter' };

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});
