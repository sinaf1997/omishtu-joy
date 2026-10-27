export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'cancelled';
export type EnrollmentSource = 'direct' | 'waitlist';
export type WaitlistStatus = 'waiting' | 'promoted' | 'removed';
export type EnrollmentOutcome = 'enroll' | 'waitlist' | 'blocked';

export interface EnrollmentCheckResult {
  outcome: EnrollmentOutcome;
  reasons: string[];
  seats_left: number;
  waitlist_position_if_added: number | null;
}

export interface EnrollmentRecord {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  enrolled_by_staff_id: string | null;
  source: EnrollmentSource;
  dropped_at: string | null;
  drop_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistRecord {
  id: string;
  student_id: string;
  course_id: string;
  status: WaitlistStatus;
  added_by_staff_id: string | null;
  joined_at: string;
  resolved_at: string | null;
  resolved_by_staff_id: string | null;
  removal_reason: string | null;
  created_at: string;
  updated_at: string;
  position?: number;
}

export interface RosterEnrolledStudent {
  id: string;
  student_id: string;
  student_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
  source: EnrollmentSource;
  dropped_at?: string | null;
  drop_reason?: string | null;
}

export interface RosterWaitlistedStudent {
  id: string;
  student_id: string;
  student_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: WaitlistStatus;
  joined_at: string;
  position: number;
  removal_reason?: string | null;
}

export interface CourseRoster {
  course: {
    id: string;
    code: string;
    title: string;
    course_type: 'major' | 'elective';
    capacity: number;
    status: string;
  };
  summary: {
    capacity: number;
    enrolled_count: number;
    seats_left: number;
    waitlist_count: number;
  };
  enrolled: RosterEnrolledStudent[];
  waitlist: RosterWaitlistedStudent[];
}

export interface StudentEnrollmentItem {
  id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  course_status: string;
  start_date: string;
  end_date: string;
  slot_summary: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolled_at: string;
  dropped_at: string | null;
  drop_reason: string | null;
}

export interface StudentWaitlistItem {
  id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  course_status: string;
  start_date: string;
  end_date: string;
  slot_summary: string;
  status: WaitlistStatus;
  joined_at: string;
  position: number;
}

export interface EnrollmentListItem {
  id: string;
  student_id: string;
  student_code: string;
  student_name: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolled_at: string;
  dropped_at: string | null;
  drop_reason: string | null;
}

export interface WaitlistSummaryCourse {
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  capacity: number;
  enrolled_count: number;
  waiting_count: number;
  oldest_waiting_at: string;
}

export interface ListEnrollmentsFilter {
  page?: number;
  limit?: number;
  student_id?: string;
  course_id?: string;
  status?: EnrollmentStatus;
  search?: string;
}
