import { Request, Response, NextFunction } from 'express';
import { UserRole, PortalType } from '../types/index.js';
import { sendError } from '../utils/api-response.js';

/**
 * Ensures the authenticated user has one of the required roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
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

/**
 * Ensures the authenticated user originates from the specified portal ('staff' | 'student').
 */
export function requirePortal(requiredPortal: PortalType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required before portal check', 401, 'UNAUTHORIZED');
      return;
    }

    if (req.user.portal !== requiredPortal) {
      sendError(
        res,
        `Forbidden: this endpoint is restricted to the ${requiredPortal} portal`,
        403,
        'WRONG_PORTAL'
      );
      return;
    }

    next();
  };
}

// Backward compatibility alias for authorize
export const authorize = (allowedRoles: UserRole[]) => requireRole(...allowedRoles);
