import { Router } from 'express';
import {
  loginStaff,
  loginStudent,
  changePassword,
  updateProfile,
  getMe,
} from './auth.controller.js';
import {
  staffLoginSchema,
  studentLoginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.schema.js';
import { validateRequest } from '../../middleware/validate.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requirePortal } from '../../middleware/authorize.js';
import { loginRateLimiter } from '../../middleware/rate-limiter.js';

const router = Router();

// Staff authentication
router.post(
  '/staff/login',
  loginRateLimiter,
  validateRequest({ body: staffLoginSchema }),
  loginStaff
);

// Student authentication
router.post(
  '/student/login',
  loginRateLimiter,
  validateRequest({ body: studentLoginSchema }),
  loginStudent
);

// Password change (enforced when must_reset_password is true or user initiates)
router.post(
  '/change-password',
  authGuard,
  validateRequest({ body: changePasswordSchema }),
  changePassword
);

// Staff profile update (self only)
router.patch(
  '/profile',
  authGuard,
  requirePortal('staff'),
  validateRequest({ body: updateProfileSchema }),
  updateProfile
);

// Session inspection
router.get('/me', authGuard, getMe);

export { router as authRouter };
