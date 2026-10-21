import crypto from 'crypto';
import { studentsRepository, StudentsRepository } from './students.repository.js';
import { hashPassword } from '../../utils/password.js';
import { StudentMember, StudentRecord, StudentStats } from './students.types.js';

function sanitizeStudent(record: StudentRecord): StudentMember {
  const isActive = Boolean(record.is_active);
  const mustReset = Boolean(record.must_reset_password);
  return {
    id: record.id,
    studentCode: record.student_code,
    student_code: record.student_code,
    mustResetPassword: mustReset,
    must_reset_password: mustReset,
    isActive,
    is_active: isActive,
    lastLoginAt: record.last_login_at,
    last_login_at: record.last_login_at,
    createdAt: record.created_at,
    created_at: record.created_at,
    updatedAt: record.updated_at,
    updated_at: record.updated_at,
  };
}

export class StudentsService {
  constructor(private repo: StudentsRepository = studentsRepository) {}

  async createStudent(input: {
    studentCode?: string;
    student_code?: string;
    password: string;
  }): Promise<StudentMember> {
    const studentCode = (input.studentCode ?? input.student_code ?? '').trim().toUpperCase();
    if (!studentCode || studentCode.length < 3) {
      const err = new Error('Student ID must be at least 3 characters long');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_STUDENT_CODE';
      throw err;
    }

    const existing = await this.repo.findStudentByCode(studentCode);
    if (existing) {
      const err = new Error('A student with this Student ID already exists');
      (err as unknown as { statusCode: number; code: string }).statusCode = 409;
      (err as unknown as { statusCode: number; code: string }).code = 'STUDENT_EXISTS';
      throw err;
    }

    if (!input.password || input.password.length < 8) {
      const err = new Error('Password must be at least 8 characters long');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'PASSWORD_TOO_SHORT';
      throw err;
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);

    await this.repo.createStudent({
      id,
      studentCode,
      passwordHash,
    });

    const created = await this.repo.findStudentById(id);
    if (!created) {
      throw new Error('Failed to retrieve newly created student record');
    }

    return sanitizeStudent(created);
  }

  async listStudents(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));

    const { students, total } = await this.repo.listStudentsPaginated({
      search: params.search,
      status: params.status,
      page,
      limit,
    });

    return {
      students: students.map(sanitizeStudent),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getStudentStats(): Promise<StudentStats> {
    return this.repo.getStudentStats();
  }

  async toggleStudentStatus(id: string, isActive: boolean): Promise<StudentMember> {
    const existing = await this.repo.findStudentById(id);
    if (!existing) {
      const err = new Error('Student not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'STUDENT_NOT_FOUND';
      throw err;
    }

    await this.repo.updateStudentStatus(id, isActive);
    const updated = await this.repo.findStudentById(id);
    return sanitizeStudent(updated!);
  }
}

export const studentsService = new StudentsService();
