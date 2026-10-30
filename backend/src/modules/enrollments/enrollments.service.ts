import { PoolConnection } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  MAX_ACTIVE_MAJORS_PER_STUDENT,
  MAX_ACTIVE_ELECTIVES_PER_STUDENT,
  MAX_WAITLIST_PER_COURSE,
  AUTO_PROMOTE_WAITLIST,
  STAFF_CAN_ENROLL_ELECTIVES,
} from '../../config/enrollmentRules.js';
import { enrollmentsRepository } from './enrollments.repository.js';
import {
  EnrollmentCheckResult,
  EnrollmentRecord,
  WaitlistRecord,
  WaitlistRequestSource,
  CourseRoster,
  StudentEnrollmentItem,
  StudentWaitlistItem,
  EnrollmentListItem,
  WaitlistSummaryCourse,
} from './enrollments.types.js';

export class EnrollmentRuleError extends Error {
  statusCode = 422;
  code = 'ENROLLMENT_RULES_FAILED';
  reasons: string[];

  constructor(reasons: string[]) {
    super(reasons.join('; '));
    this.name = 'EnrollmentRuleError';
    this.reasons = reasons;
  }
}

export class CourseFullError extends Error {
  statusCode = 409;
  code = 'COURSE_FULL';

  constructor(message: string = 'Course is full. Capacity reached.') {
    super(message);
    this.name = 'CourseFullError';
  }
}

export class EnrollmentNotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Enrollment not found') {
    super(message);
    this.name = 'EnrollmentNotFoundError';
  }
}

export class EnrollmentBadRequestError extends Error {
  statusCode = 400;
  code = 'BAD_REQUEST';

  constructor(message: string) {
    super(message);
    this.name = 'EnrollmentBadRequestError';
  }
}

const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

/**
 * Checks if two date ranges overlap [startA, endA] and [startB, endB] (inclusive)
 */
function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endB && endA >= startB;
}

/**
 * Checks if two time strings overlap (HH:MM:SS or HH:MM)
 */
function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = startA.substring(0, 5);
  const eA = endA.substring(0, 5);
  const sB = startB.substring(0, 5);
  const eB = endB.substring(0, 5);
  return sA < eB && eA > sB;
}

export const enrollmentsService = {
  /**
   * Evaluates enrollment eligibility against all 6 rules simultaneously.
   * Returns outcome: 'enroll' | 'waitlist' | 'blocked' with ALL failure reasons.
   */
  async evaluateEnrollmentEligibility(
    studentId: string,
    courseId: string,
    connection?: PoolConnection,
    options?: { isWaitlistPromotion?: boolean }
  ): Promise<EnrollmentCheckResult> {
    const reasons: string[] = [];

    // 1. Student exists and is active
    const student = await enrollmentsRepository.findStudentById(studentId, connection);
    if (!student) {
      reasons.push('Student not found.');
    } else if (!student.is_active) {
      reasons.push('Student account is inactive.');
    }

    // 2. Course exists and is 'open'
    const { course, slots } = await enrollmentsRepository.findCourseWithSlots(courseId, connection);
    if (!course) {
      reasons.push('Course not found.');
    } else if (course.status !== 'open') {
      reasons.push(`Course is not accepting enrollments (status: ${course.status}).`);
    }

    // 3. Student is not already actively enrolled or waiting
    if (student && course) {
      const existingEnrollment = await enrollmentsRepository.findEnrollmentByStudentAndCourse(
        studentId,
        courseId,
        connection
      );
      if (existingEnrollment && existingEnrollment.status === 'active') {
        reasons.push('Student is already actively enrolled in this course.');
      }

      if (!options?.isWaitlistPromotion) {
        const existingWaitlist = await enrollmentsRepository.findWaitlistByStudentAndCourse(
          studentId,
          courseId,
          connection
        );
        if (existingWaitlist && existingWaitlist.status === 'waiting') {
          reasons.push('Student is already on the waitlist for this course.');
        }
      }
    }

    // 4. Type limits & 5. Timetable conflicts
    if (student && course) {
      const activeEnrollments = await enrollmentsRepository.getActiveEnrollmentsWithSlots(studentId, connection);

      // Exclude current course from active enrollments (in case re-evaluating)
      const otherActiveEnrollments = activeEnrollments.filter((e) => e.course_id !== courseId);

      // Type limits
      if (course.course_type === 'major') {
        const activeMajors = otherActiveEnrollments.filter((e) => e.course_type === 'major');
        if (activeMajors.length >= MAX_ACTIVE_MAJORS_PER_STUDENT) {
          reasons.push(
            `Student has reached the maximum of ${MAX_ACTIVE_MAJORS_PER_STUDENT} active major course(s).`
          );
        }
      } else if (course.course_type === 'elective') {
        const activeElectives = otherActiveEnrollments.filter((e) => e.course_type === 'elective');
        if (activeElectives.length >= MAX_ACTIVE_ELECTIVES_PER_STUDENT) {
          reasons.push(
            `Student has reached the maximum of ${MAX_ACTIVE_ELECTIVES_PER_STUDENT} active elective course(s).`
          );
        }
      }

      // Timetable conflicts
      for (const other of otherActiveEnrollments) {
        if (datesOverlap(course.start_date, course.end_date, other.start_date, other.end_date)) {
          for (const newSlot of slots) {
            for (const otherSlot of other.slots) {
              if (
                newSlot.day_of_week === otherSlot.day_of_week &&
                timesOverlap(newSlot.start_time, newSlot.end_time, otherSlot.start_time, otherSlot.end_time)
              ) {
                const dayName = DAY_NAMES[newSlot.day_of_week] || `Day ${newSlot.day_of_week}`;
                const timeRange = `${newSlot.start_time.substring(0, 5)}-${newSlot.end_time.substring(0, 5)}`;
                reasons.push(
                  `Timetable clash with active course ${other.course_code} (${other.course_title}) on ${dayName} ${timeRange}.`
                );
              }
            }
          }
        }
      }
    }

    // 6. Capacity & Waitlist calculation
    let enrolledCount = 0;
    let waitlistCount = 0;
    let capacity = course?.capacity ?? 0;

    if (course) {
      enrolledCount = await enrollmentsRepository.getEnrolledCountByCourseId(courseId, connection);
      waitlistCount = await enrollmentsRepository.getWaitlistCountByCourseId(courseId, connection);
    }

    const seatsLeft = Math.max(0, capacity - enrolledCount);

    if (reasons.length > 0) {
      return {
        outcome: 'blocked',
        reasons,
        seats_left: seatsLeft,
        waitlist_position_if_added: null,
      };
    }

    if (enrolledCount < capacity) {
      return {
        outcome: 'enroll',
        reasons: [],
        seats_left: seatsLeft,
        waitlist_position_if_added: null,
      };
    }

    // Course is at capacity
    if (waitlistCount < MAX_WAITLIST_PER_COURSE) {
      return {
        outcome: 'waitlist',
        reasons: [`Course is full (${enrolledCount}/${capacity}). Student can be added to waitlist.`],
        seats_left: 0,
        waitlist_position_if_added: waitlistCount + 1,
      };
    }

    return {
      outcome: 'blocked',
      reasons: [
        `Course and waitlist are both full (capacity: ${capacity}, max waitlist: ${MAX_WAITLIST_PER_COURSE}).`,
      ],
      seats_left: 0,
      waitlist_position_if_added: null,
    };
  },

  /**
   * Enrolls a student or adds them to the waitlist atomically inside a transaction.
   */
  async enrollStudent(
    studentId: string,
    courseId: string,
    joinWaitlistIfFull: boolean = false,
    staffId?: string
  ): Promise<
    | { type: 'enrolled'; enrollment: EnrollmentRecord }
    | { type: 'waitlisted'; waitlist_entry: WaitlistRecord; position: number }
  > {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock course row FOR UPDATE to prevent race conditions
      const course = await enrollmentsRepository.lockCourseForUpdate(courseId, connection);
      if (!course) {
        throw new EnrollmentNotFoundError('Course not found');
      }

      if (!STAFF_CAN_ENROLL_ELECTIVES && course.course_type === 'elective') {
        throw new EnrollmentBadRequestError(
          "Electives are selected by the student. Approve the student's request from the waitlist."
        );
      }

      // Evaluate eligibility inside the lock
      const evaluation = await this.evaluateEnrollmentEligibility(studentId, courseId, connection);

      if (evaluation.outcome === 'blocked') {
        throw new EnrollmentRuleError(evaluation.reasons);
      }

      if (evaluation.outcome === 'enroll') {
        const enrollment = await enrollmentsRepository.createOrReactivateEnrollment(
          {
            student_id: studentId,
            course_id: courseId,
            source: 'direct',
            staff_id: staffId,
          },
          connection
        );

        // If student was on waitlist, mark it promoted
        const existingWaitlist = await enrollmentsRepository.findWaitlistByStudentAndCourse(
          studentId,
          courseId,
          connection
        );
        if (existingWaitlist && existingWaitlist.status === 'waiting') {
          await enrollmentsRepository.resolveWaitlistEntry(existingWaitlist.id, 'promoted', staffId, undefined, connection);
        }

        await connection.commit();
        return { type: 'enrolled', enrollment };
      }

      if (evaluation.outcome === 'waitlist') {
        if (!joinWaitlistIfFull) {
          throw new CourseFullError('Course is full. Capacity reached.');
        }

        const waitlistEntry = await enrollmentsRepository.createOrReactivateWaitlist(
          {
            student_id: studentId,
            course_id: courseId,
            staff_id: staffId,
          },
          connection
        );

        const position =
          (await enrollmentsRepository.getWaitlistPosition(waitlistEntry.id, courseId, connection)) ??
          evaluation.waitlist_position_if_added ??
          1;

        await connection.commit();
        return { type: 'waitlisted', waitlist_entry: waitlistEntry, position };
      }

      throw new EnrollmentRuleError(['Unknown enrollment outcome']);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Drops an active student enrollment.
   */
  async dropEnrollment(enrollmentId: string, reason: string, staffId?: string): Promise<EnrollmentRecord> {
    const existing = await enrollmentsRepository.findEnrollmentById(enrollmentId);
    if (!existing) {
      throw new EnrollmentNotFoundError('Enrollment not found');
    }

    if (existing.status !== 'active') {
      throw new EnrollmentBadRequestError(`Cannot drop enrollment with status "${existing.status}". Only active enrollments can be dropped.`);
    }

    const updated = await enrollmentsRepository.dropEnrollment(enrollmentId, reason);
    if (!updated) {
      throw new EnrollmentNotFoundError('Failed to drop enrollment');
    }

    // If AUTO_PROMOTE_WAITLIST is enabled, automatically promote next waiting student
    if (AUTO_PROMOTE_WAITLIST) {
      try {
        await this.promoteNextWaitlistEntry(existing.course_id, staffId);
      } catch {
        // Ignored if waitlist is empty or cannot promote
      }
    }

    return updated;
  },

  /**
   * Promotes a specific waiting student to active enrollment.
   */
  async promoteWaitlistEntry(
    waitlistEntryId: string,
    staffId?: string
  ): Promise<{ enrollment: EnrollmentRecord; waitlist_entry: WaitlistRecord }> {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const waitlistEntry = await enrollmentsRepository.findWaitlistEntryById(waitlistEntryId, connection);
      if (!waitlistEntry) {
        throw new EnrollmentNotFoundError('Waitlist entry not found');
      }
      if (waitlistEntry.status !== 'waiting') {
        throw new EnrollmentBadRequestError(`Cannot promote waitlist entry with status "${waitlistEntry.status}". Only waiting entries can be promoted.`);
      }

      // Lock course
      const course = await enrollmentsRepository.lockCourseForUpdate(waitlistEntry.course_id, connection);
      if (!course) {
        throw new EnrollmentNotFoundError('Course not found');
      }

      // Check current capacity
      const enrolledCount = await enrollmentsRepository.getEnrolledCountByCourseId(course.id, connection);
      if (enrolledCount >= course.capacity) {
        throw new CourseFullError(`Cannot promote: course is currently at full capacity (${enrolledCount}/${course.capacity}).`);
      }

      // Evaluate eligibility (isWaitlistPromotion = true so waiting on this course does not block)
      const evaluation = await this.evaluateEnrollmentEligibility(
        waitlistEntry.student_id,
        waitlistEntry.course_id,
        connection,
        { isWaitlistPromotion: true }
      );

      if (evaluation.outcome === 'blocked') {
        throw new EnrollmentRuleError(evaluation.reasons);
      }

      // Mark waitlist entry promoted
      const resolvedWaitlist = await enrollmentsRepository.resolveWaitlistEntry(
        waitlistEntryId,
        'promoted',
        staffId,
        undefined,
        connection
      );

      // Create or reactivate enrollment
      const enrollment = await enrollmentsRepository.createOrReactivateEnrollment(
        {
          student_id: waitlistEntry.student_id,
          course_id: waitlistEntry.course_id,
          source: 'waitlist',
          staff_id: staffId,
        },
        connection
      );

      await connection.commit();
      return { enrollment, waitlist_entry: resolvedWaitlist! };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Promotes the oldest waiting student on a course waitlist.
   */
  async promoteNextWaitlistEntry(
    courseId: string,
    staffId?: string
  ): Promise<{ enrollment: EnrollmentRecord; waitlist_entry: WaitlistRecord }> {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock course
      const course = await enrollmentsRepository.lockCourseForUpdate(courseId, connection);
      if (!course) {
        throw new EnrollmentNotFoundError('Course not found');
      }

      const enrolledCount = await enrollmentsRepository.getEnrolledCountByCourseId(courseId, connection);
      if (enrolledCount >= course.capacity) {
        throw new CourseFullError(`Cannot promote: course is currently at full capacity (${enrolledCount}/${course.capacity}).`);
      }

      const oldest = await enrollmentsRepository.getOldestWaitingEntry(courseId, connection);
      if (!oldest) {
        throw new EnrollmentBadRequestError('Waitlist is empty.');
      }

      // Evaluate eligibility for this student
      const evaluation = await this.evaluateEnrollmentEligibility(
        oldest.student_id,
        courseId,
        connection,
        { isWaitlistPromotion: true }
      );

      if (evaluation.outcome === 'blocked') {
        throw new EnrollmentRuleError(evaluation.reasons);
      }

      const resolvedWaitlist = await enrollmentsRepository.resolveWaitlistEntry(
        oldest.id,
        'promoted',
        staffId,
        undefined,
        connection
      );

      const enrollment = await enrollmentsRepository.createOrReactivateEnrollment(
        {
          student_id: oldest.student_id,
          course_id: courseId,
          source: 'waitlist',
          staff_id: staffId,
        },
        connection
      );

      await connection.commit();
      return { enrollment, waitlist_entry: resolvedWaitlist! };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Removes a student from a course waitlist.
   */
  async removeWaitlistEntry(
    waitlistEntryId: string,
    reason?: string,
    staffId?: string
  ): Promise<WaitlistRecord> {
    const existing = await enrollmentsRepository.findWaitlistEntryById(waitlistEntryId);
    if (!existing) {
      throw new EnrollmentNotFoundError('Waitlist entry not found');
    }
    if (existing.status !== 'waiting') {
      throw new EnrollmentBadRequestError(`Cannot remove waitlist entry with status "${existing.status}". Only waiting entries can be removed.`);
    }

    const updated = await enrollmentsRepository.resolveWaitlistEntry(
      waitlistEntryId,
      'removed',
      staffId,
      reason || 'Removed by staff'
    );
    return updated!;
  },

  /**
   * Returns course roster (enrolled active students and waiting students with waitlist positions).
   */
  async getCourseRoster(courseId: string, sourceFilter?: WaitlistRequestSource): Promise<CourseRoster> {
    const { course } = await enrollmentsRepository.findCourseWithSlots(courseId);
    if (!course) {
      throw new EnrollmentNotFoundError('Course not found');
    }

    const enrolledCount = await enrollmentsRepository.getEnrolledCountByCourseId(courseId);
    const waitlistCount = await enrollmentsRepository.getWaitlistCountByCourseId(courseId);
    const seatsLeft = Math.max(0, course.capacity - enrolledCount);

    const roster = await enrollmentsRepository.getCourseRoster(courseId, sourceFilter);

    return {
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        course_type: course.course_type,
        capacity: course.capacity,
        status: course.status,
      },
      summary: {
        capacity: course.capacity,
        enrolled_count: enrolledCount,
        seats_left: seatsLeft,
        waitlist_count: waitlistCount,
      },
      enrolled: roster.enrolled,
      waitlist: roster.waitlist,
    };
  },

  /**
   * Returns a student's full enrollment history and active waitlist entries.
   */
  async getStudentEnrollments(studentId: string): Promise<{
    enrollments: StudentEnrollmentItem[];
    waitlist: StudentWaitlistItem[];
  }> {
    const student = await enrollmentsRepository.findStudentById(studentId);
    if (!student) {
      throw new EnrollmentNotFoundError('Student not found');
    }

    return enrollmentsRepository.getStudentEnrollmentHistory(studentId);
  },

  /**
   * Lists enrollments with filters and pagination.
   */
  async listEnrollments(params: {
    page: number;
    limit: number;
    student_id?: string;
    course_id?: string;
    status?: any;
    search?: string;
  }): Promise<{ items: EnrollmentListItem[]; total: number; page: number; limit: number; total_pages: number }> {
    const result = await enrollmentsRepository.listEnrollments(params);
    return {
      items: result.items,
      total: result.total,
      page: params.page,
      limit: params.limit,
      total_pages: Math.ceil(result.total / params.limit) || 1,
    };
  },

  /**
   * Returns waitlist summary for all courses with waiting entries.
   */
  async getWaitlistSummary(): Promise<WaitlistSummaryCourse[]> {
    return enrollmentsRepository.getWaitlistSummary();
  },
};
