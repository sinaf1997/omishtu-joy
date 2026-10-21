export interface EmergencyContact {
  id?: string;
  fullName: string;
  full_name?: string;
  relationship: string;
  phone: string;
  alternatePhone?: string | null;
  alternate_phone?: string | null;
  isPrimary?: boolean;
  is_primary?: boolean;
}

export interface StudentRecord {
  id: string;
  studentCode: string;
  student_code?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  fullName?: string;
  full_name?: string;
  gender?: 'male' | 'female' | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  registeredByStaffId?: string | null;
  registered_by_staff_id?: string | null;
  registeredByStaffName?: string | null;
  registered_by_staff_name?: string | null;
  registeredAt?: string | null;
  registered_at?: string | null;
  mustResetPassword: boolean;
  must_reset_password?: boolean;
  isActive: boolean;
  is_active?: boolean;
  emergencyContacts?: EmergencyContact[];
  emergency_contacts?: EmergencyContact[];
  lastLoginAt?: string | null;
  last_login_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
}

export interface ListStudentsParams {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface ListStudentsResponse {
  students: StudentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  password: string;
  confirmPassword?: string;
  confirm_password?: string;
  emergencyContacts?: EmergencyContact[];
  emergency_contacts?: EmergencyContact[];
  allowDuplicateWarning?: boolean;
  allow_duplicate_warning?: boolean;
  studentCode?: string;
  student_code?: string;
}
