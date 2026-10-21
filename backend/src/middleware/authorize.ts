import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { UserRole, PortalType, StaffRole } from '../types/index.js';
import { sendError } from '../utils/api-response.js';
import { getDatabasePool } from '../config/database.js';

/**
 * Standard system role permissions map according to 002_seed_roles_permissions.sql
 */
const ROLE_PERMISSIONS_MAP: Record<StaffRole, string[]> = {
  owner: ['*'],
  manager: [
    'students:read', 'students:create', 'students:edit',
    'courses:read', 'courses:manage', 'enrollments:manage',
    'attendance:mark', 'grades:entry', 'certificates:issue',
    'fees:invoicing', 'payments:cashier', 'finance:reports',
    'payables:manage', 'audit:read', 'lms:sync'
  ],
  academic_admin: [
    'students:read', 'students:create', 'students:edit',
    'courses:read', 'courses:manage', 'enrollments:manage',
    'attendance:mark', 'grades:entry', 'certificates:issue',
    'lms:sync'
  ],
  receptionist: [
    'students:read', 'students:create', 'courses:read',
    'enrollments:manage', 'payments:cashier'
  ],
  accountant: [
    'students:read', 'fees:invoicing', 'payments:cashier',
    'finance:reports', 'payables:manage', 'ledger:manage', 'budgets:manage'
  ],
  trainer: [
    'courses:read', 'attendance:mark', 'grades:entry'
  ],
};

/**
 * Ensures the authenticated user has one of the required roles.
 * Accepts either rest parameters or an array of roles.
 */
export function requireRole(...allowedRoles: (UserRole | UserRole[])[]) {
  const flattenedRoles = allowedRoles.flat();
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required before authorization check', 401, 'UNAUTHORIZED');
      return;
    }

    if (!flattenedRoles.includes(req.user.role)) {
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

/**
 * Ensures the authenticated staff member has the specified permission code.
 */
export function requirePermission(...permissions: (string | string[])[]) {
  const requiredPermissions = permissions.flat();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'Authentication required before permission check', 401, 'UNAUTHORIZED');
      return;
    }

    if (req.user.portal !== 'staff') {
      sendError(
        res,
        'Forbidden: this endpoint is restricted to the staff portal',
        403,
        'WRONG_PORTAL'
      );
      return;
    }

    const staffRole = req.user.role as StaffRole;

    // Check fast in-memory role permissions map
    const mappedPerms = ROLE_PERMISSIONS_MAP[staffRole];
    if (mappedPerms && (mappedPerms.includes('*') || requiredPermissions.some((p) => mappedPerms.includes(p)))) {
      next();
      return;
    }

    // Fallback: check dynamic database permissions if custom role-permission assigned
    try {
      const pool = getDatabasePool();
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS count
         FROM roles r
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE r.name = ? AND p.code IN (?)`,
        [staffRole, requiredPermissions]
      );

      const count = Number(rows[0]?.count || 0);
      if (count > 0) {
        next();
        return;
      }
    } catch {
      // Database query error or table not reachable
    }

    sendError(
      res,
      'Forbidden: you do not have permission to access this resource',
      403,
      'FORBIDDEN'
    );
  };
}

// Backward compatibility alias for authorize
export const authorize = (allowedRoles: UserRole[]) => requireRole(...allowedRoles);
