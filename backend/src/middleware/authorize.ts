import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';
import { sendError } from '../utils/api-response.js';

export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required before authorization check', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'Forbidden: you do not have permission to access this resource',
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
}
