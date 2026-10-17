import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserJwtPayload } from '../types/index.js';
import { sendError } from '../utils/api-response.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required: missing Bearer token', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserJwtPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isActive: true,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Authentication token has expired', 401, 'TOKEN_EXPIRED');
      return;
    }
    sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }
}
