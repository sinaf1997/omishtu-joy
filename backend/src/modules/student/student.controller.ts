import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  studentService,
  StudentBadRequestError,
  StudentNotFoundError,
  StudentRuleError,
} from './student.service.js';
import {
  listStudentCoursesQuerySchema,
  courseIdParamSchema,
  studentScheduleQuerySchema,
} from './student.schema.js';

function handleControllerError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[0]?.message || 'Validation error',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof StudentRuleError) {
    res.status(422).json({
      error: {
        code: err.code,
        message: err.reasons[0] || 'Enrollment rule evaluation failed',
        reasons: err.reasons,
      },
    });
    return;
  }

  if (err instanceof StudentBadRequestError) {
    res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof StudentNotFoundError) {
    res.status(404).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  next(err);
}

export const studentController = {
  /**
   * GET /api/student/courses
   */
  async listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const query = listStudentCoursesQuerySchema.parse(req.query);
      const result = await studentService.listCourses(studentId, query);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  /**
   * GET /api/student/courses/:courseId
   */
  async getCourseDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const { courseId } = courseIdParamSchema.parse(req.params);
      const result = await studentService.getCourseDetail(studentId, courseId);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  /**
   * POST /api/student/electives/:courseId/request
   */
  async requestElective(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const { courseId } = courseIdParamSchema.parse(req.params);
      const result = await studentService.requestElective(studentId, courseId);
      res.status(201).json({
        data: result,
        message: 'Elective request submitted successfully and queued for staff review.',
      });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  /**
   * DELETE /api/student/electives/:courseId/request
   */
  async cancelElectiveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const { courseId } = courseIdParamSchema.parse(req.params);
      const result = await studentService.cancelElectiveRequest(studentId, courseId);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  /**
   * GET /api/student/enrollments
   */
  async getStudentEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const result = await studentService.getStudentEnrollments(studentId);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  /**
   * GET /api/student/schedule
   */
  async getStudentSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user!.id;
      const query = studentScheduleQuerySchema.parse(req.query);
      const result = await studentService.getStudentSchedule(studentId, query.includePending);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },
};
