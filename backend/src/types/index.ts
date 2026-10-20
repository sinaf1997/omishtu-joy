export type StaffRole =
  | 'owner'
  | 'receptionist'
  | 'academic_admin'
  | 'trainer'
  | 'accountant'
  | 'manager';

export type UserRole = StaffRole | 'student';

export type PortalType = 'staff' | 'student';

export interface AuthUser {
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
  isActive: boolean;
  is_active?: boolean;
  lastLoginAt?: string | Date | null;
  last_login_at?: string | Date | null;
  createdAt?: string | Date;
  created_at?: string | Date;
}

export interface UserJwtPayload {
  id: string;
  role: UserRole;
  portal: PortalType;
  mustResetPassword?: boolean;
  iat?: number;
  exp?: number;
}
