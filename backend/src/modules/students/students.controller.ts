import { Request, Response } from 'express';
import { studentsService } from './students.service.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { CreateStudentInput } from './students.schema.js';

export async function listStudents(req: Request, res: Response): Promise<void> {
  try {
    const { search, status, page, limit } = req.query as {
      search?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    const result = await studentsService.listStudents({
      search,
      status,
      page: parsedPage,
      limit: parsedLimit,
    });

    sendSuccess(res, result.students, 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list students';
    sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function getStudentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const student = await studentsService.getStudentById(id);
    sendSuccess(res, student);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STUDENT_FETCH_FAILED';
    sendError(res, errorWithStatus.message || 'Failed to retrieve student record', statusCode, errorCode);
  }
}

export async function getStudentStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await studentsService.getStudentStats();
    sendSuccess(res, stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve student stats';
    sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  try {
    const student = await studentsService.createStudent(
      req.body as CreateStudentInput,
      req.user?.id
    );
    sendSuccess(res, student, 201);
  } catch (err: unknown) {
    const errorWithStatus = err as {
      statusCode?: number;
      code?: string;
      message?: string;
      existingStudentId?: string;
    };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STUDENT_CREATE_ERROR';
    const details = errorWithStatus.existingStudentId
      ? { existingStudentId: errorWithStatus.existingStudentId }
      : undefined;

    sendError(
      res,
      errorWithStatus.message || 'Failed to create student account',
      statusCode,
      errorCode,
      details
    );
  }
}

export async function toggleStudentStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_active } = req.body as { is_active?: boolean };

  try {
    const updated = await studentsService.toggleStudentStatus(id, is_active);
    sendSuccess(res, updated);
  } catch (err: unknown) {
    const errorWithStatus = err as { statusCode?: number; code?: string; message?: string };
    const statusCode = errorWithStatus.statusCode || 500;
    const errorCode = errorWithStatus.code || 'STUDENT_STATUS_UPDATE_ERROR';
    sendError(res, errorWithStatus.message || 'Failed to update student status', statusCode, errorCode);
  }
}
