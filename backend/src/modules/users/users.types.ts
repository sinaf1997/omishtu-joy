import { StaffRole } from '../../types/index.js';

export interface StaffRecord {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: string;
  role_name: StaffRole;
  role_display_name: string;
  must_reset_password: number | boolean;
  is_active: number | boolean;
  last_login_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentRecord {
  id: string;
  student_code: string;
  password_hash: string;
  must_reset_password: number | boolean;
  is_active: number | boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleRecord {
  id: string;
  name: StaffRole;
  display_name: string;
  description: string | null;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  role: StaffRole;
  roleDisplayName: string;
  mustResetPassword: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentMember {
  id: string;
  studentCode: string;
  role: 'student';
  mustResetPassword: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffData {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  mustResetPassword?: boolean;
  isActive?: boolean;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  totalRoles: number;
}
