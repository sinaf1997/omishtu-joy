import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/api-response.js';

interface RequestValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schema: RequestValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', formattedErrors);
        return;
      }
      next(error);
    }
  };
}
