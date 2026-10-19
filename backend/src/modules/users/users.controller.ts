import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import {
  CreateStaffInput,
  UpdateStaffRoleInput,
  UpdateStaffStatusInput,
} from './users.schema.js';

export async function listStaff(_req: Request, res: Response): Promise<void> {
  try {
    const staffList = await usersService.listStaff();
    sendSuccess(res, staffList);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list staff accounts';
    sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function createStaff(req: Request, res: Response): Promise<void> {
  const { fullName, email, role } = req.body as CreateStaffInput;

  try {
    const result = await usersService.createStaff({ fullName, email, role });
    sendSuccess(
      res,
      {
        staff: result.staff,
        temporaryPassword: result.temporaryPassword,
      },
      201
    );
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STAFF_CREATE_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to create staff member', statusCode, errorCode);
  }
}

export async function updateStaffRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body as UpdateStaffRoleInput;

  try {
    const updatedStaff = await usersService.updateStaffRole(id, role);
    sendSuccess(res, updatedStaff);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STAFF_UPDATE_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to update staff role', statusCode, errorCode);
  }
}

export async function updateStaffStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive } = req.body as UpdateStaffStatusInput;

  try {
    const updatedStaff = await usersService.updateStaffStatus(id, isActive);
    sendSuccess(res, updatedStaff);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STAFF_STATUS_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to update staff status', statusCode, errorCode);
  }
}

export async function listRoles(_req: Request, res: Response): Promise<void> {
  try {
    const roles = await usersService.listRoles();
    sendSuccess(res, roles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve roles';
    sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
