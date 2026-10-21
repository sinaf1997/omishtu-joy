import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import {
  CreateStaffInput,
  UpdateStaffInput,
} from './users.schema.js';

export async function listStaff(req: Request, res: Response): Promise<void> {
  try {
    const { search, role, status, page, limit } = req.query as {
      search?: string;
      role?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    const result = await usersService.listStaff({
      search,
      role,
      status,
      page: parsedPage,
      limit: parsedLimit,
    });

    sendSuccess(res, result.users, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list staff accounts';
    sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function getStaffStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await usersService.getStaffStats();
    sendSuccess(res, stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve staff stats';
    sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function createStaff(req: Request, res: Response): Promise<void> {
  const { full_name, fullName, email, phone, password, role } = req.body as CreateStaffInput;
  const creatorRole = req.user?.role;

  try {
    const staff = await usersService.createStaff(
      {
        fullName: full_name ?? fullName,
        email,
        phone,
        password,
        role,
      },
      creatorRole
    );
    sendSuccess(res, staff, 201);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STAFF_CREATE_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to create staff member', statusCode, errorCode);
  }
}

export async function updateStaff(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updates = req.body as UpdateStaffInput;
  const requestingOwnerId = req.user?.id || '';

  try {
    const updatedStaff = await usersService.updateStaff(id, requestingOwnerId, updates);
    sendSuccess(res, updatedStaff);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STAFF_UPDATE_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to update staff member', statusCode, errorCode);
  }
}

export async function resetStaffPassword(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const result = await usersService.resetStaffPassword(id);
    sendSuccess(res, {
      temporaryPassword: result.temporaryPassword,
      staff: result.staff,
    });
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'PASSWORD_RESET_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to reset staff password', statusCode, errorCode);
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
