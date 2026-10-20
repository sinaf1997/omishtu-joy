import crypto from 'crypto';
import { usersRepository, UsersRepository, ListStaffFilters } from './users.repository.js';
import {
  StaffRecord,
  StaffMember,
  RoleRecord,
  StaffStats,
} from './users.types.js';
import { StaffRole } from '../../types/index.js';
import { hashPassword, generateTempPassword } from '../../utils/password.js';
import { UpdateStaffInput } from './users.schema.js';

export function sanitizeStaff(record: StaffRecord): StaffMember {
  const isActive = Boolean(record.is_active);
  const mustReset = Boolean(record.must_reset_password);
  return {
    id: record.id,
    full_name: record.full_name,
    fullName: record.full_name,
    email: record.email,
    phone: record.phone || null,
    roleId: record.role_id,
    role_id: record.role_id,
    role: record.role_name,
    roleDisplayName: record.role_display_name,
    role_display_name: record.role_display_name,
    mustResetPassword: mustReset,
    must_reset_password: mustReset,
    isActive,
    is_active: isActive,
    lastLoginAt: record.last_login_at,
    last_login_at: record.last_login_at,
    deactivatedAt: record.deactivated_at,
    deactivated_at: record.deactivated_at,
    createdAt: record.created_at,
    created_at: record.created_at,
    updatedAt: record.updated_at,
    updated_at: record.updated_at,
  };
}

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async listStaff(filters: ListStaffFilters = {}): Promise<{
    users: StaffMember[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const { staff, total } = await this.repo.listStaffPaginated({
      ...filters,
      page,
      limit,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      users: staff.map(sanitizeStaff),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getStaffById(id: string): Promise<StaffMember | null> {
    const record = await this.repo.findStaffById(id);
    return record ? sanitizeStaff(record) : null;
  }

  async createStaff(input: {
    fullName?: string;
    full_name?: string;
    email: string;
    phone?: string | null;
    password: string;
    role: StaffRole;
  }): Promise<StaffMember> {
    if (input.role === 'owner') {
      const err = new Error('Cannot assign the owner role');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
      throw err;
    }

    const email = input.email.toLowerCase().trim();
    const existing = await this.repo.findStaffByEmail(email);
    if (existing) {
      const err = new Error('A user with this email already exists');
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

    const fullName = (input.full_name ?? input.fullName ?? '').trim();
    const rawPassword = input.password;
    if (!rawPassword || rawPassword.length < 8) {
      const err = new Error('Password must be at least 8 characters long');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'PASSWORD_TOO_SHORT';
      throw err;
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(rawPassword);

    await this.repo.createStaff({
      id,
      fullName,
      email,
      phone: input.phone || null,
      passwordHash,
      roleId: roleRecord.id,
      mustResetPassword: true,
      isActive: true,
    });

    const created = await this.repo.findStaffById(id);
    if (!created) {
      throw new Error('Failed to retrieve newly created staff member');
    }

    return sanitizeStaff(created);
  }

  async updateStaff(
    targetId: string,
    requestingOwnerId: string,
    updates: UpdateStaffInput
  ): Promise<StaffMember> {
    const targetStaff = await this.repo.findStaffById(targetId);
    if (!targetStaff) {
      const err = new Error('Staff member not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
      throw err;
    }

    const targetIsOwner = targetStaff.role_name === 'owner';
    const targetIsActive = Boolean(targetStaff.is_active);

    const newFullName = updates.full_name ?? updates.fullName;
    const newPhone = updates.phone;
    const newRole = updates.role;
    const newRoleId = updates.role_id ?? updates.roleId;
    const newIsActive = updates.is_active ?? updates.isActive;

    // Rule: Owner role cannot be assigned through Edit user
    if (newRole === 'owner') {
      const err = new Error('Cannot assign the owner role');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
      throw err;
    }

    let resolvedRoleId: string | undefined = undefined;
    if (newRoleId) {
      const roleRec = await this.repo.findRoleById(newRoleId);
      if (!roleRec) {
        const err = new Error(`Invalid role ID '${newRoleId}' specified`);
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
        throw err;
      }
      if (roleRec.name === 'owner') {
        const err = new Error('Cannot assign the owner role');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
        throw err;
      }
      resolvedRoleId = roleRec.id;
    } else if (newRole) {
      const roleRec = await this.repo.findRoleByName(newRole);
      if (!roleRec) {
        const err = new Error(`Invalid role '${newRole}' specified`);
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'INVALID_ROLE';
        throw err;
      }
      resolvedRoleId = roleRec.id;
    }

    // Rule: The owner cannot deactivate, demote or change the role of their own account
    if (targetId === requestingOwnerId) {
      if (newIsActive === false) {
        const err = new Error('You cannot deactivate your own owner account');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'CANNOT_DEACTIVATE_SELF';
        throw err;
      }
      if ((newRole && newRole !== 'owner') || (resolvedRoleId && resolvedRoleId !== targetStaff.role_id)) {
        const err = new Error('You cannot demote or change your own owner role');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'CANNOT_DEMOTE_SELF';
        throw err;
      }
    }

    // Rule: There must always be at least one active owner. Block any change that would break this.
    if (targetIsOwner && targetIsActive) {
      const isDeactivating = newIsActive === false;
      const isChangingRoleToNonOwner =
        (newRole && newRole !== 'owner') ||
        (resolvedRoleId && resolvedRoleId !== targetStaff.role_id);

      if (isDeactivating || isChangingRoleToNonOwner) {
        const activeOwners = await this.repo.countActiveOwners();
        if (activeOwners <= 1) {
          const err = new Error(
            'There must always be at least one active owner. This change would leave the system without an active owner.'
          );
          (err as unknown as { statusCode: number; code: string }).statusCode = 400;
          (err as unknown as { statusCode: number; code: string }).code = 'LAST_ACTIVE_OWNER';
          throw err;
        }
      }
    }

    await this.repo.updateStaffProfile(targetId, {
      fullName: newFullName,
      phone: newPhone,
      roleId: resolvedRoleId,
      isActive: newIsActive,
    });

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
