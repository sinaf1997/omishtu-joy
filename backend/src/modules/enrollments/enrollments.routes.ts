import { Router } from 'express';
import { enrollmentsController } from './enrollments.controller.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requirePortal, requirePermission } from '../../middleware/authorize.js';

const enrollmentsRouter = Router();

// All enrollment endpoints require authenticated staff
enrollmentsRouter.use(authGuard);
enrollmentsRouter.use(requirePortal('staff'));

// Read operations
enrollmentsRouter.get('/waitlist-summary', requirePermission('courses:read'), enrollmentsController.getWaitlistSummary);
enrollmentsRouter.get('/', requirePermission('courses:read'), enrollmentsController.listEnrollments);

// Manage operations (require enrollments:manage)
enrollmentsRouter.post('/check', requirePermission('enrollments:manage'), enrollmentsController.checkEligibility);
enrollmentsRouter.post('/', requirePermission('enrollments:manage'), enrollmentsController.enrollStudent);
enrollmentsRouter.patch('/:id/drop', requirePermission('enrollments:manage'), enrollmentsController.dropEnrollment);

const waitlistRouter = Router();

waitlistRouter.use(authGuard);
waitlistRouter.use(requirePortal('staff'));

waitlistRouter.post('/:id/promote', requirePermission('enrollments:manage'), enrollmentsController.promoteWaitlistEntry);
waitlistRouter.patch('/:id/remove', requirePermission('enrollments:manage'), enrollmentsController.removeWaitlistEntry);
waitlistRouter.delete('/:id', requirePermission('enrollments:manage'), enrollmentsController.removeWaitlistEntry);

export { enrollmentsRouter, waitlistRouter };
