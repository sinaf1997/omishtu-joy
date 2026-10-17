import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown
): Response {
  const payload: ApiResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details !== undefined && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
}
