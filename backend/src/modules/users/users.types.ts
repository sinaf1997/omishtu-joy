import { StaffRole } from '../../types/index.js';

export interface StaffRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
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
  user_count?: number;
  userCount?: number;
}

export interface StaffMember {
  id: string;
  full_name: string;
  fullName: string;
  email: string;
  phone: string | null;
  roleId: string;
  role_id?: string;
  role: StaffRole;
  roleDisplayName: string;
  role_display_name?: string;
  mustResetPassword: boolean;
  must_reset_password: boolean;
  isActive: boolean;
  is_active: boolean;
  lastLoginAt: string | null;
  last_login_at: string | null;
  deactivatedAt?: string | null;
  deactivated_at?: string | null;
  createdAt: string;
  created_at: string;
  updatedAt?: string;
  updated_at?: string;
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
  phone?: string | null;
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
