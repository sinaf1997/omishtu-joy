import crypto from 'crypto';
import { coursesRepository, buildSlotSummary } from './courses.repository.js';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseFilter,
  CourseWithDetails,
  CourseStatus,
  CourseStats,
  TrainerOption,
} from './courses.types.js';

export class CourseConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'CourseConflictError';
  }
}

export class CourseBadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'CourseBadRequestError';
  }
}

export class CourseNotFoundError extends Error {
  statusCode = 404;
  constructor(message: string = 'Course not found') {
    super(message);
    this.name = 'CourseNotFoundError';
  }
}

/**
 * Calculates duration in full or partial weeks between start and end dates.
 */
function calculateDurationWeeks(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.ceil(diffDays / 7));
}

export const coursesService = {
  /**
   * Returns the count of students currently enrolled in the given course.
   * NOTE: Returns 0 for now until Sprint 3 Part 2 (enrollment module).
   * Replacing this one function in the next prompt wires real enrollment metrics.
   */
  async getEnrolledCount(_courseId: string): Promise<number> {
    return 0;
  },

  async createCourse(data: CreateCourseDto, staffId?: string): Promise<CourseWithDetails> {
    const existingCode = await coursesRepository.findCourseByCode(data.code);
    if (existingCode) {
      throw new CourseConflictError('A course with this code already exists');
    }

    // Schedule conflict detection
    const conflict = await coursesRepository.findScheduleConflict({
      startDate: data.start_date,
      endDate: data.end_date,
      trainerId: data.trainer_id,
      slots: data.slots,
    });

    if (conflict) {
      throw new CourseConflictError(conflict.detail);
    }

    const durationWeeks =
      data.duration_weeks ?? calculateDurationWeeks(data.start_date, data.end_date);

    const courseId = crypto.randomUUID();
    const slotRecords = data.slots.map((s) => ({
      id: crypto.randomUUID(),
      day_of_week: s.day_of_week,
      start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
      end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
      room: s.room || null,
    }));

    await coursesRepository.createCourseWithSlots(
      {
        id: courseId,
        code: data.code.toUpperCase(),
        title: data.title,
        description: data.description || null,
        course_type: data.course_type,
        duration_weeks: durationWeeks,
        start_date: data.start_date,
        end_date: data.end_date,
        capacity: data.capacity,
        trainer_id: data.trainer_id || null,
        location: data.location || null,
        status: 'draft',
        created_by_staff_id: staffId || null,
      },
      slotRecords
    );

    const created = await this.getCourseById(courseId);
    return created;
  },

  async updateCourse(id: string, data: UpdateCourseDto): Promise<CourseWithDetails> {
    const current = await coursesRepository.findCourseById(id);
    if (!current) {
      throw new CourseNotFoundError();
    }

    if (data.code && data.code.toUpperCase() !== current.code) {
      const existing = await coursesRepository.findCourseByCode(data.code, id);
      if (existing) {
        throw new CourseConflictError('A course with this code already exists');
      }
    }

    // Capacity can never be lowered below enrolled_count
    if (data.capacity !== undefined) {
      const enrolled = await this.getEnrolledCount(id);
      if (data.capacity < enrolled) {
        throw new CourseBadRequestError(
          `Capacity cannot be lowered below current enrolled count of ${enrolled}`
        );
      }
    }

    const effectiveStartDate = data.start_date ?? current.start_date;
    const effectiveEndDate = data.end_date ?? current.end_date;
    const effectiveTrainerId =
      data.trainer_id !== undefined ? data.trainer_id : current.trainer_id;

    // Check conflict if slots or dates or trainer are supplied
    let slotsForConflict = data.slots;
    if (!slotsForConflict) {
      const existingSlots = await coursesRepository.findSlotsByCourseId(id);
      slotsForConflict = existingSlots.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
      }));
    }

    const conflict = await coursesRepository.findScheduleConflict({
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      trainerId: effectiveTrainerId,
      slots: slotsForConflict,
      excludeCourseId: id,
    });

    if (conflict) {
      throw new CourseConflictError(conflict.detail);
    }

    const durationWeeks =
      data.duration_weeks !== undefined
        ? data.duration_weeks
        : (data.start_date || data.end_date)
        ? calculateDurationWeeks(effectiveStartDate, effectiveEndDate)
        : current.duration_weeks;

    const slotRecords = data.slots
      ? data.slots.map((s) => ({
          id: crypto.randomUUID(),
          day_of_week: s.day_of_week,
          start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
          end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
          room: s.room || null,
        }))
      : undefined;

    await coursesRepository.updateCourseWithSlots(
      id,
      {
        code: data.code ? data.code.toUpperCase() : undefined,
        title: data.title,
        description: data.description,
        course_type: data.course_type,
        duration_weeks: durationWeeks,
        start_date: data.start_date,
        end_date: data.end_date,
        capacity: data.capacity,
        trainer_id: data.trainer_id,
        location: data.location,
      },
      slotRecords
    );

    return this.getCourseById(id);
  },

  async updateStatus(id: string, newStatus: CourseStatus): Promise<CourseWithDetails> {
    const current = await coursesRepository.findCourseById(id);
    if (!current) {
      throw new CourseNotFoundError();
    }

    if (current.status === newStatus) {
      return this.getCourseById(id);
    }

    // Allowed status transitions:
    // draft -> open, draft -> cancelled
    // open -> in_progress, open -> cancelled
    // in_progress -> completed, in_progress -> cancelled
    const validMoves: Record<CourseStatus, CourseStatus[]> = {
      draft: ['open', 'cancelled'],
      open: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const allowed = validMoves[current.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new CourseBadRequestError(
        `Cannot change course status from '${current.status}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}`
      );
    }

    // Special rule: A course needs at least one slot before it can be set to open
    if (newStatus === 'open') {
      const slots = await coursesRepository.findSlotsByCourseId(id);
      if (slots.length === 0) {
        throw new CourseBadRequestError(
          'A course needs at least one timetable slot before it can be opened for enrollment'
        );
      }
    }

    await coursesRepository.updateCourseStatus(id, newStatus);
    return this.getCourseById(id);
  },

  async getCourseById(id: string): Promise<CourseWithDetails> {
    const course = await coursesRepository.findCourseById(id);
    if (!course) {
      throw new CourseNotFoundError();
    }

    const slots = await coursesRepository.findSlotsByCourseId(id);
    const enrolled_count = await this.getEnrolledCount(id);

    let trainer_name: string | null = null;
    if (course.trainer_id) {
      const trainers = await coursesRepository.listTrainers();
      const match = trainers.find((t) => t.id === course.trainer_id);
      trainer_name = match ? match.full_name : null;
    }

    return {
      ...course,
      trainer_name,
      enrolled_count,
      slot_summary: buildSlotSummary(slots),
      slots,
    };
  },

  async listCourses(filter: CourseFilter): Promise<{
    courses: CourseWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const { courses, total } = await coursesRepository.listCourses(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      courses,
      total,
      page,
      limit,
      totalPages,
    };
  },

  async getStats(): Promise<CourseStats> {
    return coursesRepository.getStats();
  },

  async listTrainers(): Promise<TrainerOption[]> {
    return coursesRepository.listTrainers();
  },
};
