import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserJwtPayload } from '../types/index.js';
import { sendError } from '../utils/api-response.js';
import { usersRepository } from '../modules/users/users.repository.js';

export async function authGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required: missing Bearer token', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserJwtPayload;

    if (!decoded.id || !decoded.role || !decoded.portal) {
      sendError(res, 'Invalid authentication token payload', 401, 'INVALID_TOKEN');
      return;
    }

    // Check is_active in database:
    // A deactivated user's token stops working on the next request.
    if (decoded.portal === 'staff') {
      const active = await usersRepository.isStaffActive(decoded.id);
      if (!active) {
        sendError(res, 'Staff account is deactivated or inactive', 403, 'ACCOUNT_INACTIVE');
        return;
      }
    } else {
      const active = await usersRepository.isStudentActive(decoded.id);
      if (!active) {
        sendError(res, 'Student account is deactivated or inactive', 403, 'ACCOUNT_INACTIVE');
        return;
      }
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      portal: decoded.portal,
      mustResetPassword: Boolean(decoded.mustResetPassword),
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

// Backward compatibility alias
export const authenticate = authGuard;
