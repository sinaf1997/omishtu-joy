import { Router } from 'express';
import {
  listStudents,
  getStudentById,
  getStudentStats,
  createStudent,
  toggleStudentStatus,
} from './students.controller.js';
import { enrollmentsController } from '../enrollments/enrollments.controller.js';
import {
  createStudentSchema,
  listStudentsQuerySchema,
} from './students.schema.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requirePortal, requirePermission } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

// Student administration routes guarded by permissions: students:read, students:create
router.use(authGuard);
router.use(requirePortal('staff'));

router.get('/stats', requirePermission('students:read'), getStudentStats);
router.get('/', requirePermission('students:read'), validateRequest({ query: listStudentsQuerySchema }), listStudents);
router.get('/:id/enrollments', requirePermission('courses:read'), enrollmentsController.getStudentEnrollments);
router.get('/:id', requirePermission('students:read'), getStudentById);
router.post('/', requirePermission('students:create'), validateRequest({ body: createStudentSchema }), createStudent);
router.patch('/:id/status', requirePermission('students:edit', 'students:create'), toggleStudentStatus);

export { router as studentsRouter };
