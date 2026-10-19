import crypto from 'crypto';
import { usersRepository, UsersRepository } from './users.repository.js';
import {
  StaffRecord,
  StaffMember,
  RoleRecord,
} from './users.types.js';
import { StaffRole } from '../../types/index.js';
import { hashPassword, generateTempPassword } from '../../utils/password.js';

export function sanitizeStaff(record: StaffRecord): StaffMember {
  return {
    id: record.id,
    fullName: record.full_name,
    email: record.email,
    roleId: record.role_id,
    role: record.role_name,
    roleDisplayName: record.role_display_name,
    mustResetPassword: Boolean(record.must_reset_password),
    isActive: Boolean(record.is_active),
    lastLoginAt: record.last_login_at,
    deactivatedAt: record.deactivated_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async listStaff(): Promise<StaffMember[]> {
    const records = await this.repo.listStaff();
    return records.map(sanitizeStaff);
  }

  async getStaffById(id: string): Promise<StaffMember | null> {
    const record = await this.repo.findStaffById(id);
    return record ? sanitizeStaff(record) : null;
  }

  async createStaff(input: {
    fullName: string;
    email: string;
    role: StaffRole;
  }): Promise<{ staff: StaffMember; temporaryPassword: string }> {
    const existing = await this.repo.findStaffByEmail(input.email);
    if (existing) {
      const err = new Error('A staff member with this email address already exists');
      (err as unknown as { statusCode: number; code: string }).statusCode = 409;
      (err as unknown as { statusCode: number; code: string }).code = 'EMAIL_EXISTS';
      throw err;
    }

    const roleRecord = await this.repo.findRoleByName(input.role);
    if (!roleRecord) {
      const err = new Error(`Invalid role '${input.role}' specified`);
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
      throw err;
    }

    const id = crypto.randomUUID();
    const temporaryPassword = generateTempPassword(12);
    const passwordHash = await hashPassword(temporaryPassword);

    await this.repo.createStaff({
      id,
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      roleId: roleRecord.id,
      mustResetPassword: true,
      isActive: true,
    });

    const created = await this.repo.findStaffById(id);
    if (!created) {
      throw new Error('Failed to retrieve newly created staff member');
    }

    return {
      staff: sanitizeStaff(created),
      temporaryPassword,
    };
  }

  async updateStaffRole(id: string, newRole: StaffRole): Promise<StaffMember> {
    const staff = await this.repo.findStaffById(id);
    if (!staff) {
      const err = new Error('Staff member not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
      throw err;
    }

    const roleRecord = await this.repo.findRoleByName(newRole);
    if (!roleRecord) {
      const err = new Error(`Invalid role '${newRole}' specified`);
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
      throw err;
    }

    await this.repo.updateStaffRole(id, roleRecord.id);

    const updated = await this.repo.findStaffById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated staff member');
    }
    return sanitizeStaff(updated);
  }

  async updateStaffStatus(id: string, isActive: boolean): Promise<StaffMember> {
    const staff = await this.repo.findStaffById(id);
    if (!staff) {
      const err = new Error('Staff member not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
      throw err;
    }

    await this.repo.updateStaffStatus(id, isActive);

    const updated = await this.repo.findStaffById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated staff member');
    }
    return sanitizeStaff(updated);
  }

  async listRoles(): Promise<RoleRecord[]> {
    return this.repo.listRoles();
  }
}

export const usersService = new UsersService();
