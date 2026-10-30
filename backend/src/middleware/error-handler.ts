import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response.js';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[API Error]:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Do not expose stack traces or raw database error details in production
  const details = env.NODE_ENV === 'development' ? err.details || err.stack : undefined;

  sendError(res, message, statusCode, code, details);
}
