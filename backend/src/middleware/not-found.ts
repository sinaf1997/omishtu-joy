import { Request, Response } from 'express';
import { sendError } from '../utils/api-response.js';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
}
