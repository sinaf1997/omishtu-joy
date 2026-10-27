export type CourseType = 'major' | 'elective';

export type CourseStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface CourseSlotInput {
  day_of_week: number; // 1 = Mon ... 7 = Sun
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  room?: string | null;
}

export interface CourseSlot {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  course_type: CourseType;
  duration_weeks: number | null;
  start_date: string;
  end_date: string;
  capacity: number;
  trainer_id: string | null;
  trainer_name?: string | null;
  location: string | null;
  status: CourseStatus;
  created_by_staff_id: string | null;
  created_at: string;
  updated_at: string;
  enrolled_count: number;
  slot_summary: string;
  slots: CourseSlot[];
}

export interface CourseStats {
  total: number;
  major: number;
  elective: number;
  open: number;
}

export interface CourseFilter {
  search?: string;
  course_type?: CourseType;
  status?: CourseStatus;
  trainer_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateCoursePayload {
  code: string;
  title: string;
  description?: string | null;
  course_type: CourseType;
  duration_weeks?: number | null;
  start_date: string;
  end_date: string;
  capacity: number;
  trainer_id?: string | null;
  location?: string | null;
  slots: CourseSlotInput[];
}

export interface UpdateCoursePayload {
  code?: string;
  title?: string;
  description?: string | null;
  course_type?: CourseType;
  duration_weeks?: number | null;
  start_date?: string;
  end_date?: string;
  capacity?: number;
  trainer_id?: string | null;
  location?: string | null;
  slots?: CourseSlotInput[];
}

export interface TrainerOption {
  id: string;
  full_name: string;
}
