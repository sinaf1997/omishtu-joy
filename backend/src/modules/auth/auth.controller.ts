import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import {
  StaffLoginInput,
  StudentLoginInput,
  ChangePasswordInput,
} from './auth.schema.js';

export async function loginStaff(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as StaffLoginInput;

  try {
    const session = await authService.loginStaff(email, password);
    sendSuccess(res, session);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STAFF_LOGIN_FAILED';
    sendError(res, errorWithStatus.message || 'Staff login failed', statusCode, errorCode);
  }
}

export async function loginStudent(req: Request, res: Response): Promise<void> {
  const { studentCode, password } = req.body as StudentLoginInput;

  try {
    const session = await authService.loginStudent(studentCode, password);
    sendSuccess(res, session);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STUDENT_LOGIN_FAILED';
    sendError(res, errorWithStatus.message || 'Student login failed', statusCode, errorCode);
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    return;
  }

  const { currentPassword, newPassword } = req.body as ChangePasswordInput;

  try {
    const session = await authService.changePassword(
      req.user.id,
      req.user.portal,
      currentPassword,
      newPassword
    );
    sendSuccess(res, session);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'PASSWORD_CHANGE_FAILED';
    sendError(res, errorWithStatus.message || 'Password change failed', statusCode, errorCode);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    return;
  }

  try {
    const user = await authService.getMe(req.user.id, req.user.portal);
    sendSuccess(res, user);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'SESSION_FETCH_FAILED';
    sendError(res, errorWithStatus.message || 'Failed to fetch session', statusCode, errorCode);
  }
}
