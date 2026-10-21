export interface StudentRecord {
  id: string;
  student_code: string;
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
  mustResetPassword: boolean;
  must_reset_password: boolean;
  isActive: boolean;
  is_active: boolean;
  lastLoginAt: string | null;
  last_login_at: string | null;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
}

export interface CreateStudentData {
  id: string;
  studentCode: string;
  passwordHash: string;
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
}
