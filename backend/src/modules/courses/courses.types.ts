import { RowDataPacket } from 'mysql2/promise';

export type CourseType = 'major' | 'elective';

export type CourseStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface CourseScheduleSlotInput {
  day_of_week: number; // 1 = Monday ... 7 = Sunday
  start_time: string; // HH:mm or HH:mm:ss
  end_time: string; // HH:mm or HH:mm:ss
  room?: string | null;
}

export interface CourseScheduleSlotRecord extends RowDataPacket {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseRecord extends RowDataPacket {
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
  location: string | null;
  status: CourseStatus;
  created_by_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithDetails extends CourseRecord {
  trainer_name?: string | null;
  enrolled_count: number;
  slot_summary: string;
  slots: CourseScheduleSlotRecord[];
}

export interface CreateCourseDto {
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
  slots: CourseScheduleSlotInput[];
}

export interface UpdateCourseDto {
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
  slots?: CourseScheduleSlotInput[];
}

export interface CourseFilter {
  search?: string;
  course_type?: CourseType;
  status?: CourseStatus;
  trainer_id?: string;
  page?: number;
  limit?: number;
}

export interface CourseStats {
  total: number;
  major: number;
  elective: number;
  open: number;
}

export interface TrainerOption extends RowDataPacket {
  id: string;
  full_name: string;
}

export interface ConflictResult {
  conflicting_course_code: string;
  conflicting_course_title: string;
  conflict_type: 'trainer' | 'room';
  day_of_week: number;
  start_time: string;
  end_time: string;
  detail: string;
}
