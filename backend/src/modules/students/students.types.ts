export interface EmergencyContactInput {
  fullName?: string;
  full_name?: string;
  relationship: string;
  phone: string;
  alternatePhone?: string | null;
  alternate_phone?: string | null;
}

export interface EmergencyContactRecord {
  id: string;
  student_id: string;
  full_name: string;
  contact_name?: string;
  relationship: string;
  phone: string;
  alternate_phone: string | null;
  alt_phone?: string | null;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContactResponse {
  id: string;
  studentId: string;
  student_id: string;
  fullName: string;
  full_name: string;
  relationship: string;
  phone: string;
  alternatePhone: string | null;
  alternate_phone: string | null;
  isPrimary: boolean;
  is_primary: boolean;
  createdAt: string;
  created_at: string;
}

export interface StudentRecord {
  id: string;
  student_code: string;
  first_name?: string;
  last_name?: string | null;
  gender?: 'male' | 'female' | null;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  registered_by_staff_id?: string | null;
  registered_by_staff_name?: string | null;
  registered_at?: string | null;
  password_hash: string;
  must_reset_password: number;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentMember {
  id: string;
  studentCode: string;
  student_code: string;
  firstName: string;
  first_name: string;
  lastName: string;
  last_name: string;
  fullName: string;
  full_name: string;
  gender: 'male' | 'female' | null;
  dateOfBirth: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  registeredByStaffId: string | null;
  registered_by_staff_id: string | null;
  registeredByStaffName: string | null;
  registered_by_staff_name: string | null;
  registeredAt: string | null;
  registered_at: string | null;
  mustResetPassword: boolean;
  must_reset_password: boolean;
  isActive: boolean;
  is_active: boolean;
  lastLoginAt: string | null;
  last_login_at: string | null;
  emergencyContacts?: EmergencyContactResponse[];
  emergency_contacts?: EmergencyContactResponse[];
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
}

export interface CreateStudentPayload {
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  password?: string;
  confirmPassword?: string;
  confirm_password?: string;
  emergencyContacts?: EmergencyContactInput[];
  emergency_contacts?: EmergencyContactInput[];
  allowDuplicateWarning?: boolean;
  allow_duplicate_warning?: boolean;
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
}
