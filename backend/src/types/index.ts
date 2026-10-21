export type StaffRole =
  | 'owner'
  | 'receptionist'
  | 'academic_admin'
  | 'trainer'
  | 'accountant'
  | 'manager';

export type UserRole = StaffRole | 'student';

export type PortalType = 'staff' | 'student';

export interface EmergencyContactInfo {
  id: string;
  studentId?: string;
  student_id?: string;
  fullName: string;
  full_name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string | null;
  alternate_phone?: string | null;
  isPrimary: boolean;
  is_primary: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  fullName?: string;
  full_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  gender?: 'male' | 'female' | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  studentCode?: string;
  student_code?: string;
  registeredAt?: string | null;
  registered_at?: string | null;
  emergencyContacts?: EmergencyContactInfo[];
  emergency_contacts?: EmergencyContactInfo[];
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
