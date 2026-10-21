export interface StudentRecord {
  id: string;
  studentCode: string;
  student_code?: string;
  mustResetPassword: boolean;
  must_reset_password?: boolean;
  isActive: boolean;
  is_active?: boolean;
  lastLoginAt: string | null;
  last_login_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
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
  studentCode: string;
  password: string;
}
