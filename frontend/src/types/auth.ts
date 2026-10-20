export type StaffRole =
  | 'owner'
  | 'receptionist'
  | 'academic_admin'
  | 'trainer'
  | 'accountant'
  | 'manager';

export type UserRole = StaffRole | 'student';

export type PortalType = 'staff' | 'student';

export interface User {
  id: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  studentCode?: string;
  role: UserRole;
  role_name?: string;
  roleDisplayName?: string;
  role_display_name?: string;
  portal: PortalType;
  mustResetPassword: boolean;
  must_reset_password?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  lastLoginAt?: string | null;
  last_login_at?: string | null;
  createdAt?: string;
  created_at?: string;
}

export interface StaffLoginCredentials {
  email: string;
  password: string;
}

export interface StudentLoginCredentials {
  studentCode: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StaffMemberRecord {
  id: string;
  fullName: string;
  full_name?: string;
  email: string;
  roleId: string;
  role_id?: string;
  role: StaffRole;
  roleDisplayName: string;
  role_display_name?: string;
  mustResetPassword: boolean;
  must_reset_password?: boolean;
  isActive: boolean;
  is_active?: boolean;
  lastLoginAt: string | null;
  last_login_at?: string | null;
  deactivatedAt: string | null;
  deactivated_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  role: StaffRole;
}

export interface CreateStaffResponse {
  staff: StaffMemberRecord;
  temporaryPassword: string;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  totalRoles: number;
}

export interface RoleRecord {
  id: string;
  name: StaffRole;
  display_name: string;
  displayName?: string;
  description: string | null;
  user_count?: number;
  userCount?: number;
}

export interface UpdateStaffPayload {
  fullName?: string;
  full_name?: string;
  role?: StaffRole;
  roleId?: string;
  role_id?: string;
  isActive?: boolean;
  is_active?: boolean;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
  staff: StaffMemberRecord;
}

export interface ListUsersParams {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

export interface ListUsersResponse {
  users: StaffMemberRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
