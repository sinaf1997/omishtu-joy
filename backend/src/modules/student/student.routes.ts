import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authGuard } from '../../middleware/authenticate.js';
import { requirePortal } from '../../middleware/authorize.js';

const router = Router();

// Strict portal isolation: all student endpoints require student authentication
router.use(authGuard);
router.use(requirePortal('student'));

// Course browsing
router.get('/courses', studentController.listCourses);
router.get('/courses/:courseId', studentController.getCourseDetail);

// Elective requests
router.post('/electives/:courseId/request', studentController.requestElective);
router.delete('/electives/:courseId/request', studentController.cancelElectiveRequest);

// Enrollments, requests and history
router.get('/enrollments', studentController.getStudentEnrollments);

// Weekly schedule
router.get('/schedule', studentController.getStudentSchedule);

export const studentRouter = router;
