import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  checkEnrollmentSchema,
  createEnrollmentSchema,
  dropEnrollmentSchema,
  removeWaitlistSchema,
  listEnrollmentsQuerySchema,
} from './enrollments.schema.js';
import {
  enrollmentsService,
  EnrollmentRuleError,
  CourseFullError,
  EnrollmentNotFoundError,
  EnrollmentBadRequestError,
} from './enrollments.service.js';

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

  if (err instanceof EnrollmentRuleError) {
    res.status(422).json({
      error: {
        code: err.code,
        message: err.reasons[0] || 'Enrollment rules evaluation failed',
        reasons: err.reasons,
      },
    });
    return;
  }

  if (err instanceof CourseFullError) {
    res.status(409).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof EnrollmentNotFoundError) {
    res.status(404).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof EnrollmentBadRequestError) {
    res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  next(err);
}

export const enrollmentsController = {
  async checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = checkEnrollmentSchema.parse(req.body);
      const result = await enrollmentsService.evaluateEnrollmentEligibility(data.student_id, data.course_id);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createEnrollmentSchema.parse(req.body);
      const staffId = req.user?.id;
      const result = await enrollmentsService.enrollStudent(
        data.student_id,
        data.course_id,
        data.join_waitlist_if_full,
        staffId
      );
      res.status(201).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async dropEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = dropEnrollmentSchema.parse(req.body);
      const staffId = req.user?.id;
      const result = await enrollmentsService.dropEnrollment(id, data.reason, staffId);
      res.status(200).json({ data: { enrollment: result } });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async promoteWaitlistEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const staffId = req.user?.id;
      const result = await enrollmentsService.promoteWaitlistEntry(id, staffId);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async promoteNextWaitlistEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // courseId
      const staffId = req.user?.id;
      const result = await enrollmentsService.promoteNextWaitlistEntry(id, staffId);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async removeWaitlistEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = removeWaitlistSchema.parse(req.body || {});
      const staffId = req.user?.id;
      const result = await enrollmentsService.removeWaitlistEntry(id, data.reason, staffId);
      res.status(200).json({ data: { waitlist_entry: result } });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async getCourseRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // courseId
      const result = await enrollmentsService.getCourseRoster(id);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async getStudentEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // studentId
      const result = await enrollmentsService.getStudentEnrollments(id);
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async listEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listEnrollmentsQuerySchema.parse(req.query);
      const result = await enrollmentsService.listEnrollments(query);
      res.status(200).json({
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          total_pages: result.total_pages,
        },
      });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },

  async getWaitlistSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await enrollmentsService.getWaitlistSummary();
      res.status(200).json({ data: result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  },
};
