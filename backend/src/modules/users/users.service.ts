import crypto from 'crypto';
import { usersRepository, UsersRepository } from './users.repository.js';
import {
  StaffRecord,
  StaffMember,
  RoleRecord,
  StaffStats,
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
    if (input.role === 'owner') {
      const err = new Error('Cannot create additional owner accounts');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
      throw err;
    }

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

  async updateStaff(
    targetId: string,
    requestingOwnerId: string,
    updates: { role?: StaffRole; isActive?: boolean }
  ): Promise<StaffMember> {
    const staff = await this.repo.findStaffById(targetId);
    if (!staff) {
      const err = new Error('Staff member not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
      throw err;
    }

    // Owner cannot deactivate or demote themselves
    if (targetId === requestingOwnerId) {
      if (updates.isActive === false) {
        const err = new Error('You cannot deactivate your own owner account');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'CANNOT_DEACTIVATE_SELF';
        throw err;
      }
      if (updates.role && updates.role !== 'owner') {
        const err = new Error('You cannot demote or change your own owner role');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'CANNOT_DEMOTE_SELF';
        throw err;
      }
    }

    // Cannot promote another staff to owner via this route
    if (updates.role === 'owner' && targetId !== requestingOwnerId) {
      const err = new Error('Cannot assign the owner role to another staff account');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
      throw err;
    }

    if (updates.role) {
      const roleRecord = await this.repo.findRoleByName(updates.role);
      if (!roleRecord) {
        const err = new Error(`Invalid role '${updates.role}' specified`);
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
        throw err;
      }
      await this.repo.updateStaffRole(targetId, roleRecord.id);
    }

    if (updates.isActive !== undefined) {
      await this.repo.updateStaffStatus(targetId, updates.isActive);
    }

    const updated = await this.repo.findStaffById(targetId);
    if (!updated) {
      throw new Error('Failed to retrieve updated staff member');
    }
    return sanitizeStaff(updated);
  }

  async resetStaffPassword(
    targetId: string
  ): Promise<{ temporaryPassword: string; staff: StaffMember }> {
    const staff = await this.repo.findStaffById(targetId);
    if (!staff) {
      const err = new Error('Staff member not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
      throw err;
    }

    const temporaryPassword = generateTempPassword(12);
    const passwordHash = await hashPassword(temporaryPassword);

    await this.repo.resetStaffPassword(targetId, passwordHash);

    const updated = await this.repo.findStaffById(targetId);
    if (!updated) {
      throw new Error('Failed to retrieve updated staff member');
    }

    return {
      temporaryPassword,
      staff: sanitizeStaff(updated),
    };
  }

  async getStaffStats(): Promise<StaffStats> {
    return this.repo.getStaffStats();
  }

  async listRoles(): Promise<RoleRecord[]> {
    return this.repo.listRoles();
  }
}

export const usersService = new UsersService();
