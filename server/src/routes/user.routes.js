import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listRecruiters,
} from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createUserRules,
  updateUserRules,
  mongoIdParam,
} from '../validators/index.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/recruiters', listRecruiters);
router.get('/', listUsers);
router.get('/:id', mongoIdParam, validate, getUser);
router.post('/', createUserRules, validate, createUser);
router.patch('/:id', updateUserRules, validate, updateUser);
router.delete('/:id', mongoIdParam, validate, deleteUser);

export default router;
