import { Router } from 'express';
import {
  listStaff,
  getStaffStats,
  createStaff,
  updateStaff,
  resetStaffPassword,
  listRoles,
} from './users.controller.js';
import {
  createStaffSchema,
  updateStaffSchema,
  userIdParamsSchema,
} from './users.schema.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requireRole, requirePortal } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

// All staff administration routes are strictly Owner-only within the staff portal
router.use(authGuard);
router.use(requirePortal('staff'));
router.use(requireRole('owner'));

router.get('/', listStaff);
router.get('/stats', getStaffStats);
router.get('/roles', listRoles);
router.post('/', validateRequest({ body: createStaffSchema }), createStaff);
router.patch(
  '/:id',
  validateRequest({ params: userIdParamsSchema, body: updateStaffSchema }),
  updateStaff
);
router.post(
  '/:id/reset-password',
  validateRequest({ params: userIdParamsSchema }),
  resetStaffPassword
);

// Backward-compatibility aliases
router.patch(
  '/:id/role',
  validateRequest({ params: userIdParamsSchema, body: updateStaffSchema }),
  updateStaff
);
router.patch(
  '/:id/status',
  validateRequest({ params: userIdParamsSchema, body: updateStaffSchema }),
  updateStaff
);

export { router as usersRouter };
