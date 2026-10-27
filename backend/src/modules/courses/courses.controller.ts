import { Request, Response, NextFunction } from 'express';
import {
  coursesService,
  CourseConflictError,
  CourseBadRequestError,
  CourseNotFoundError,
} from './courses.service.js';
import {
  createCourseSchema,
  updateCourseSchema,
  updateCourseStatusSchema,
  courseFilterSchema,
} from './courses.schema.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';

export const coursesController = {
  async listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = courseFilterSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        sendError(
          res,
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          parsedQuery.error.format()
        );
        return;
      }

      const result = await coursesService.listCourses(parsedQuery.data);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await coursesService.getStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  },

  async listTrainers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainers = await coursesService.listTrainers();
      sendSuccess(res, trainers);
    } catch (err) {
      next(err);
    }
  },

  async getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const course = await coursesService.getCourseById(id);
      sendSuccess(res, course);
    } catch (err) {
      if (err instanceof CourseNotFoundError) {
        sendError(res, err.message, 404, 'NOT_FOUND');
        return;
      }
      next(err);
    }
  },

  async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message || 'Validation failed for course creation';
        sendError(
          res,
          firstIssue,
          400,
          'VALIDATION_ERROR',
          parsed.error.format()
        );
        return;
      }

      const staffId = req.user?.id;
      const created = await coursesService.createCourse(parsed.data, staffId);
      sendSuccess(res, created, 201);
    } catch (err) {
      if (err instanceof CourseConflictError) {
        sendError(res, err.message, 409, 'CONFLICT');
        return;
      }
      if (err instanceof CourseBadRequestError) {
        sendError(res, err.message, 400, 'BAD_REQUEST');
        return;
      }
      next(err);
    }
  },

  async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = updateCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message || 'Validation failed for course update';
        sendError(
          res,
          firstIssue,
          400,
          'VALIDATION_ERROR',
          parsed.error.format()
        );
        return;
      }

      const updated = await coursesService.updateCourse(id, parsed.data);
      sendSuccess(res, updated);
    } catch (err) {
      if (err instanceof CourseNotFoundError) {
        sendError(res, err.message, 404, 'NOT_FOUND');
        return;
      }
      if (err instanceof CourseConflictError) {
        sendError(res, err.message, 409, 'CONFLICT');
        return;
      }
      if (err instanceof CourseBadRequestError) {
        sendError(res, err.message, 400, 'BAD_REQUEST');
        return;
      }
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parsed = updateCourseStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          'Invalid status update payload',
          400,
          'VALIDATION_ERROR',
          parsed.error.format()
        );
        return;
      }

      const updated = await coursesService.updateStatus(id, parsed.data.status);
      sendSuccess(res, updated);
    } catch (err) {
      if (err instanceof CourseNotFoundError) {
        sendError(res, err.message, 404, 'NOT_FOUND');
        return;
      }
      if (err instanceof CourseBadRequestError) {
        sendError(res, err.message, 400, 'BAD_REQUEST');
        return;
      }
      next(err);
    }
  },
};
