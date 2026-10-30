import { Router } from 'express';
import { coursesController } from './courses.controller.js';
import { enrollmentsController } from '../enrollments/enrollments.controller.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requirePortal, requirePermission } from '../../middleware/authorize.js';

const router = Router();

// All course endpoints require authenticated staff
router.use(authGuard);
router.use(requirePortal('staff'));

// Read endpoints (courses:read)
router.get('/stats', requirePermission('courses:read'), coursesController.getStats);
router.get('/trainers', requirePermission('courses:read'), coursesController.listTrainers);
router.get('/', requirePermission('courses:read'), coursesController.listCourses);
router.get('/:id/roster', requirePermission('courses:read'), enrollmentsController.getCourseRoster);
router.get('/:id', requirePermission('courses:read'), coursesController.getCourseById);

// Manage endpoints (courses:manage / enrollments:manage)
router.post('/:id/waitlist/promote-next', requirePermission('enrollments:manage'), enrollmentsController.promoteNextWaitlistEntry);
router.post('/', requirePermission('courses:manage'), coursesController.createCourse);
router.patch('/:id/status', requirePermission('courses:manage', 'enrollments:manage'), coursesController.updateStatus);
router.patch('/:id', requirePermission('courses:manage'), coursesController.updateCourse);

export const coursesRouter = router;
