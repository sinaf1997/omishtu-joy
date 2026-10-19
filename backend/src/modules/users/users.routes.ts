import { Router } from 'express';
import {
  listStaff,
  createStaff,
  updateStaffRole,
  updateStaffStatus,
  listRoles,
} from './users.controller.js';
import {
  createStaffSchema,
  updateStaffRoleSchema,
  updateStaffStatusSchema,
  userIdParamsSchema,
} from './users.schema.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requireRole, requirePortal } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

// All user management routes are strictly Owner-only within the staff portal
router.use(authGuard);
router.use(requirePortal('staff'));
router.use(requireRole('owner'));

router.get('/', listStaff);
router.get('/roles', listRoles);
router.post('/', validateRequest({ body: createStaffSchema }), createStaff);
router.patch(
  '/:id/role',
  validateRequest({ params: userIdParamsSchema, body: updateStaffRoleSchema }),
  updateStaffRole
);
router.patch(
  '/:id/status',
  validateRequest({ params: userIdParamsSchema, body: updateStaffStatusSchema }),
  updateStaffStatus
);

export { router as usersRouter };
