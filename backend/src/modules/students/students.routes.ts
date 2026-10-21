import { Router } from 'express';
import {
  listStudents,
  getStudentStats,
  createStudent,
  toggleStudentStatus,
} from './students.controller.js';
import {
  createStudentSchema,
  listStudentsQuerySchema,
} from './students.schema.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requireRole, requirePortal } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

// Student administration routes accessible to staff roles: owner, manager, receptionist, academic_admin
router.use(authGuard);
router.use(requirePortal('staff'));
router.use(requireRole(['owner', 'manager', 'receptionist', 'academic_admin']));

router.get('/stats', getStudentStats);
router.get('/', validateRequest({ query: listStudentsQuerySchema }), listStudents);
router.post('/', validateRequest({ body: createStudentSchema }), createStudent);
router.patch('/:id/status', toggleStudentStatus);

export { router as studentsRouter };
