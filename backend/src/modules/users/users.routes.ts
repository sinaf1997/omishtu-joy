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
  listUsersQuerySchema,
} from './users.schema.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requireRole, requirePortal } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

// Staff administration routes accessible to Owner and Receptionist
router.use(authGuard);
router.use(requirePortal('staff'));


router.get('/stats', requireRole('owner'), getStaffStats);
router.get('/roles', requireRole(['owner', 'receptionist']), listRoles);
router.get('/', requireRole('owner'), validateRequest({ query: listUsersQuerySchema }), listStaff);
router.post('/', requireRole(['owner', 'receptionist']), validateRequest({ body: createStaffSchema }), createStaff);

// Modifying and resetting staff accounts is Owner-only
router.patch(
  '/:id',
  requireRole('owner'),
  validateRequest({ params: userIdParamsSchema, body: updateStaffSchema }),
  updateStaff
);
router.post(
  '/:id/reset-password',
  requireRole('owner'),
  validateRequest({ params: userIdParamsSchema }),
  resetStaffPassword
);

// Backward-compatibility aliases
router.patch(
  '/:id/role',
  requireRole('owner'),
  validateRequest({ params: userIdParamsSchema, body: updateStaffSchema }),
  updateStaff
);
router.patch(
  '/:id/status',
  requireRole('owner'),
  validateRequest({ params: userIdParamsSchema, body: updateStaffSchema }),
  updateStaff
);

export { router as usersRouter };

// Dedicated router for GET /api/roles
const rolesRouter = Router();
rolesRouter.use(authGuard);
rolesRouter.use(requirePortal('staff'));
rolesRouter.use(requireRole(['owner', 'receptionist']));
rolesRouter.get('/', listRoles);

export { rolesRouter };
