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
  email?: string;
  studentCode?: string;
  role: UserRole;
  portal: PortalType;
  mustResetPassword: boolean;
  isActive: boolean;
}

export interface UserJwtPayload {
  id: string;
  role: UserRole;
  portal: PortalType;
  mustResetPassword?: boolean;
  iat?: number;
  exp?: number;
}
