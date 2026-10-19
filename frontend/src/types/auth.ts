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
  email?: string;
  studentCode?: string;
  role: UserRole;
  roleDisplayName?: string;
  portal: PortalType;
  mustResetPassword: boolean;
  isActive?: boolean;
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
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StaffMemberRecord {
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

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  role: StaffRole;
}

export interface CreateStaffResponse {
  staff: StaffMemberRecord;
  temporaryPassword: string;
}
