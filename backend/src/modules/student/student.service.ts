import { PoolConnection } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import { enrollmentsRepository } from '../enrollments/enrollments.repository.js';
import { studentRepository } from './student.repository.js';
import {
  MAX_ACTIVE_ELECTIVES_PER_STUDENT,
  MAX_WAITLIST_PER_COURSE,
} from '../../config/enrollmentRules.js';
import {
  StudentCourseItem,
  StudentCourseStatus,
  StudentScheduleSlot,
  WaitlistRecord,
} from '../enrollments/enrollments.types.js';
import { buildSlotSummary } from '../courses/courses.repository.js';
import { ListStudentCoursesQuery } from './student.schema.js';

export class StudentNotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'StudentNotFoundError';
  }
}

export class StudentBadRequestError extends Error {
  statusCode = 400;
  code = 'BAD_REQUEST';
  constructor(message: string) {
    super(message);
    this.name = 'StudentBadRequestError';
  }
}

export class StudentRuleError extends Error {
  statusCode = 422;
  code = 'RULE_VIOLATION';
  reasons: string[];
  constructor(reasons: string[]) {
    super(reasons[0] || 'Enrollment rule violation');
    this.reasons = reasons;
    this.name = 'StudentRuleError';
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

function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endB && endA >= startB;
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = startA.substring(0, 5);
  const eA = endA.substring(0, 5);
  const sB = startB.substring(0, 5);
  const eB = endB.substring(0, 5);
  return sA < eB && eA > sB;
}

export const studentService = {
  /**
   * Lists open courses for browsing with student-specific status chips and request eligibility.
   */
  async listCourses(
    studentId: string,
    query: ListStudentCoursesQuery
  ): Promise<{
    courses: StudentCourseItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const courseType = query.course_type || query.type;
    const { courses: rawCourses, total, slotsMap } = await studentRepository.findOpenCourses({
      page: query.page,
      limit: query.limit,
      search: query.search,
      course_type: courseType,
      weekday: query.weekday,
    });

    // Fetch student's current active enrollments and pending waitlists
    const activeEnrollments = await enrollmentsRepository.getActiveEnrollmentsWithSlots(studentId);
    const pendingWaitlists = await studentRepository.getStudentPendingWaitlistsWithSlots(studentId);

    const activeElectivesCount = activeEnrollments.filter((e) => e.course_type === 'elective').length;
    const pendingElectivesCount = pendingWaitlists.filter((w) => w.course_type === 'elective').length;
    const totalElectivesCount = activeElectivesCount + pendingElectivesCount;

    const items: StudentCourseItem[] = [];

    for (const c of rawCourses) {
      const slots = slotsMap.get(c.id) || [];
      const slotSummary = buildSlotSummary(slots);
      const enrolledCount = Number(c.enrolled_count || 0);
      const capacity = Number(c.capacity || 0);
      const seatsLeft = Math.max(0, capacity - enrolledCount);

      const isEnrolled = activeEnrollments.some((e) => e.course_id === c.id);
      const pendingMatch = pendingWaitlists.find((w) => w.course_id === c.id);

      let myStatus: StudentCourseStatus = 'none';
      let canRequest = false;
      const blockingReasons: string[] = [];
      let waitlistPosition: number | null = null;

      if (isEnrolled) {
        myStatus = 'enrolled';
      } else if (pendingMatch) {
        myStatus = 'requested';
        waitlistPosition = await enrollmentsRepository.getWaitlistPosition(pendingMatch.waitlist_id, c.id);
      } else if (c.course_type === 'major') {
        myStatus = 'none';
        canRequest = false;
        blockingReasons.push(
          'Major courses are enrolled by the front desk. Visit reception or the academic office.'
        );
      } else {
        // Elective course eligibility evaluation
        // 1. Elective limit (max 3 total active + pending)
        if (totalElectivesCount >= MAX_ACTIVE_ELECTIVES_PER_STUDENT) {
          blockingReasons.push(
            `You have reached the maximum of ${MAX_ACTIVE_ELECTIVES_PER_STUDENT} active and pending elective courses.`
          );
        }

        // 2. Timetable conflict against student's active enrollments
        for (const targetSlot of slots) {
          for (const active of activeEnrollments) {
            if (active.course_id !== c.id && datesOverlap(c.start_date, c.end_date, active.start_date, active.end_date)) {
              for (const aSlot of active.slots) {
                if (
                  targetSlot.day_of_week === aSlot.day_of_week &&
                  timesOverlap(targetSlot.start_time, targetSlot.end_time, aSlot.start_time, aSlot.end_time)
                ) {
                  blockingReasons.push(
                    `Schedule conflict with '${active.course_code} - ${active.course_title}' on ${
                      DAY_NAMES[targetSlot.day_of_week]
                    } (${targetSlot.start_time.substring(0, 5)}-${targetSlot.end_time.substring(0, 5)}).`
                  );
                }
              }
            }
          }
        }

        // 3. Timetable conflict against student's other pending requests
        for (const targetSlot of slots) {
          for (const pending of pendingWaitlists) {
            if (pending.course_id !== c.id && datesOverlap(c.start_date, c.end_date, pending.start_date, pending.end_date)) {
              for (const pSlot of pending.slots) {
                if (
                  targetSlot.day_of_week === pSlot.day_of_week &&
                  timesOverlap(targetSlot.start_time, targetSlot.end_time, pSlot.start_time, pSlot.end_time)
                ) {
                  blockingReasons.push(
                    `Schedule conflict with pending request '${pending.course_code} - ${pending.course_title}' on ${
                      DAY_NAMES[targetSlot.day_of_week]
                    } (${targetSlot.start_time.substring(0, 5)}-${targetSlot.end_time.substring(0, 5)}).`
                  );
                }
              }
            }
          }
        }

        // 4. Waitlist cap check
        const waitlistCount = await enrollmentsRepository.getWaitlistCountByCourseId(c.id);
        if (waitlistCount >= MAX_WAITLIST_PER_COURSE) {
          blockingReasons.push(`The waitlist for this course is full (max ${MAX_WAITLIST_PER_COURSE}).`);
        }

        if (blockingReasons.length === 0) {
          myStatus = 'none';
          canRequest = true;
        } else {
          myStatus = 'blocked';
          canRequest = false;
        }
      }

      items.push({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        course_type: c.course_type,
        trainer_name: c.trainer_name,
        start_date: c.start_date,
        end_date: c.end_date,
        duration_weeks: c.duration_weeks,
        location: c.location,
        weekly_slots: slots,
        slot_summary: slotSummary,
        capacity,
        enrolled_count: enrolledCount,
        seats_left: seatsLeft,
        my_status: myStatus,
        can_request: canRequest,
        blocking_reasons: blockingReasons,
        waitlist_position: waitlistPosition,
      });
    }

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      courses: items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  },

  /**
   * Fetches single open course details with full timetable and student status.
   */
  async getCourseDetail(studentId: string, courseId: string): Promise<StudentCourseItem> {
    const { course: c, slots } = await studentRepository.findOpenCourseById(courseId);
    if (!c) {
      throw new StudentNotFoundError('Course not found or is not open for enrollment');
    }

    const activeEnrollments = await enrollmentsRepository.getActiveEnrollmentsWithSlots(studentId);
    const pendingWaitlists = await studentRepository.getStudentPendingWaitlistsWithSlots(studentId);

    const activeElectivesCount = activeEnrollments.filter((e) => e.course_type === 'elective').length;
    const pendingElectivesCount = pendingWaitlists.filter((w) => w.course_type === 'elective').length;
    const totalElectivesCount = activeElectivesCount + pendingElectivesCount;

    const slotSummary = buildSlotSummary(slots);
    const enrolledCount = Number(c.enrolled_count || 0);
    const capacity = Number(c.capacity || 0);
    const seatsLeft = Math.max(0, capacity - enrolledCount);

    const isEnrolled = activeEnrollments.some((e) => e.course_id === c.id);
    const pendingMatch = pendingWaitlists.find((w) => w.course_id === c.id);

    let myStatus: StudentCourseStatus = 'none';
    let canRequest = false;
    const blockingReasons: string[] = [];
    let waitlistPosition: number | null = null;

    if (isEnrolled) {
      myStatus = 'enrolled';
    } else if (pendingMatch) {
      myStatus = 'requested';
      waitlistPosition = await enrollmentsRepository.getWaitlistPosition(pendingMatch.waitlist_id, c.id);
    } else if (c.course_type === 'major') {
      myStatus = 'none';
      canRequest = false;
      blockingReasons.push(
        'Major courses are enrolled by the front desk. Visit reception or the academic office.'
      );
    } else {
      if (totalElectivesCount >= MAX_ACTIVE_ELECTIVES_PER_STUDENT) {
        blockingReasons.push(
          `You have reached the maximum of ${MAX_ACTIVE_ELECTIVES_PER_STUDENT} active and pending elective courses.`
        );
      }

      for (const targetSlot of slots) {
        for (const active of activeEnrollments) {
          if (active.course_id !== c.id && datesOverlap(c.start_date, c.end_date, active.start_date, active.end_date)) {
            for (const aSlot of active.slots) {
              if (
                targetSlot.day_of_week === aSlot.day_of_week &&
                timesOverlap(targetSlot.start_time, targetSlot.end_time, aSlot.start_time, aSlot.end_time)
              ) {
                blockingReasons.push(
                  `Schedule conflict with '${active.course_code} - ${active.course_title}' on ${
                    DAY_NAMES[targetSlot.day_of_week]
                  } (${targetSlot.start_time.substring(0, 5)}-${targetSlot.end_time.substring(0, 5)}).`
                );
              }
            }
          }
        }
      }

      for (const targetSlot of slots) {
        for (const pending of pendingWaitlists) {
          if (pending.course_id !== c.id && datesOverlap(c.start_date, c.end_date, pending.start_date, pending.end_date)) {
            for (const pSlot of pending.slots) {
              if (
                targetSlot.day_of_week === pSlot.day_of_week &&
                timesOverlap(targetSlot.start_time, targetSlot.end_time, pSlot.start_time, pSlot.end_time)
              ) {
                blockingReasons.push(
                  `Schedule conflict with pending request '${pending.course_code} - ${pending.course_title}' on ${
                    DAY_NAMES[targetSlot.day_of_week]
                  } (${targetSlot.start_time.substring(0, 5)}-${targetSlot.end_time.substring(0, 5)}).`
                );
              }
            }
          }
        }
      }

      const waitlistCount = await enrollmentsRepository.getWaitlistCountByCourseId(c.id);
      if (waitlistCount >= MAX_WAITLIST_PER_COURSE) {
        blockingReasons.push(`The waitlist for this course is full (max ${MAX_WAITLIST_PER_COURSE}).`);
      }

      if (blockingReasons.length === 0) {
        myStatus = 'none';
        canRequest = true;
      } else {
        myStatus = 'blocked';
        canRequest = false;
      }
    }

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      course_type: c.course_type,
      trainer_name: c.trainer_name,
      start_date: c.start_date,
      end_date: c.end_date,
      duration_weeks: c.duration_weeks,
      location: c.location,
      weekly_slots: slots,
      slot_summary: slotSummary,
      capacity,
      enrolled_count: enrolledCount,
      seats_left: seatsLeft,
      my_status: myStatus,
      can_request: canRequest,
      blocking_reasons: blockingReasons,
      waitlist_position: waitlistPosition,
    };
  },

  /**
   * Submits an elective course request on the waitlist.
   * Atomically verifies prerequisites, timetable conflicts, and limits inside a transaction.
   */
  async requestElective(
    studentId: string,
    courseId: string
  ): Promise<{
    waitlist_entry: WaitlistRecord;
    position: number;
  }> {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Lock course row FOR UPDATE
      const course = await enrollmentsRepository.lockCourseForUpdate(courseId, connection);
      if (!course) {
        throw new StudentNotFoundError('Course not found');
      }

      if (course.course_type !== 'elective') {
        throw new StudentBadRequestError('Major courses are enrolled by the front desk.');
      }

      if (course.status !== 'open') {
        throw new StudentBadRequestError(
          `Course is not accepting enrollment requests (status: ${course.status}).`
        );
      }

      // 2. Student exists and is active
      const student = await enrollmentsRepository.findStudentById(studentId, connection);
      if (!student) {
        throw new StudentNotFoundError('Student profile not found');
      }
      if (!student.is_active) {
        throw new StudentBadRequestError('Student account is inactive.');
      }

      // 3. Not already actively enrolled
      const existingEnrollment = await enrollmentsRepository.findEnrollmentByStudentAndCourse(
        studentId,
        courseId,
        connection
      );
      if (existingEnrollment && existingEnrollment.status === 'active') {
        throw new StudentBadRequestError('Student is already actively enrolled in this course.');
      }

      // 4. Not already waiting
      const existingWaitlist = await enrollmentsRepository.findWaitlistByStudentAndCourse(
        studentId,
        courseId,
        connection
      );
      if (existingWaitlist && existingWaitlist.status === 'waiting') {
        throw new StudentBadRequestError('Student already has a pending request for this course.');
      }

      // 5. Elective limits (max 3 total active + pending requests)
      const activeEnrollments = await enrollmentsRepository.getActiveEnrollmentsWithSlots(studentId, connection);
      const pendingWaitlists = await studentRepository.getStudentPendingWaitlistsWithSlots(studentId, connection);

      const otherActiveElectives = activeEnrollments.filter(
        (e) => e.course_type === 'elective' && e.course_id !== courseId
      );
      const otherPendingElectives = pendingWaitlists.filter(
        (w) => w.course_type === 'elective' && w.course_id !== courseId
      );

      const totalElectives = otherActiveElectives.length + otherPendingElectives.length;
      if (totalElectives >= MAX_ACTIVE_ELECTIVES_PER_STUDENT) {
        throw new StudentRuleError([
          `You have reached the maximum of ${MAX_ACTIVE_ELECTIVES_PER_STUDENT} active and pending elective courses.`,
        ]);
      }

      // 6. Timetable conflict checks against active enrollments and other pending requests
      const { slots: courseSlots } = await enrollmentsRepository.findCourseWithSlots(courseId, connection);

      // Conflicts with active enrollments
      for (const targetSlot of courseSlots) {
        for (const active of activeEnrollments) {
          if (active.course_id !== courseId && datesOverlap(course.start_date, course.end_date, active.start_date, active.end_date)) {
            for (const aSlot of active.slots) {
              if (
                targetSlot.day_of_week === aSlot.day_of_week &&
                timesOverlap(targetSlot.start_time, targetSlot.end_time, aSlot.start_time, aSlot.end_time)
              ) {
                throw new StudentRuleError([
                  `Schedule conflict with '${active.course_code} - ${active.course_title}' on ${
                    DAY_NAMES[targetSlot.day_of_week]
                  } (${targetSlot.start_time.substring(0, 5)}-${targetSlot.end_time.substring(0, 5)}).`,
                ]);
              }
            }
          }
        }
      }

      // Conflicts with other pending requests
      for (const targetSlot of courseSlots) {
        for (const pending of pendingWaitlists) {
          if (pending.course_id !== courseId && datesOverlap(course.start_date, course.end_date, pending.start_date, pending.end_date)) {
            for (const pSlot of pending.slots) {
              if (
                targetSlot.day_of_week === pSlot.day_of_week &&
                timesOverlap(targetSlot.start_time, targetSlot.end_time, pSlot.start_time, pSlot.end_time)
              ) {
                throw new StudentRuleError([
                  `Schedule conflict with pending request '${pending.course_code} - ${pending.course_title}' on ${
                    DAY_NAMES[targetSlot.day_of_week]
                  } (${targetSlot.start_time.substring(0, 5)}-${targetSlot.end_time.substring(0, 5)}).`,
                ]);
              }
            }
          }
        }
      }

      // 7. Waitlist cap check
      const waitlistCount = await enrollmentsRepository.getWaitlistCountByCourseId(courseId, connection);
      if (waitlistCount >= MAX_WAITLIST_PER_COURSE) {
        throw new StudentRuleError([`The waitlist for this course is full (max ${MAX_WAITLIST_PER_COURSE}).`]);
      }

      // 8. Create or reactivate waitlist entry with request_source = 'student_request'
      const waitlistEntry = await enrollmentsRepository.createOrReactivateWaitlist(
        {
          student_id: studentId,
          course_id: courseId,
          request_source: 'student_request',
        },
        connection
      );

      await connection.commit();

      const position =
        (await enrollmentsRepository.getWaitlistPosition(waitlistEntry.id, courseId)) || 1;

      return {
        waitlist_entry: waitlistEntry,
        position,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Cancels a student's own pending elective request.
   */
  async cancelElectiveRequest(
    studentId: string,
    courseId: string
  ): Promise<{ message: string }> {
    const existingWaitlist = await enrollmentsRepository.findWaitlistByStudentAndCourse(studentId, courseId);
    if (!existingWaitlist || existingWaitlist.status !== 'waiting') {
      throw new StudentBadRequestError('No active pending request found for this course.');
    }

    await enrollmentsRepository.resolveWaitlistEntry(
      existingWaitlist.id,
      'removed',
      undefined,
      'Cancelled by student'
    );

    return { message: 'Elective request cancelled successfully' };
  },

  /**
   * Returns student's active enrollments, pending requests, and decision history.
   */
  async getStudentEnrollments(studentId: string): Promise<{
    active_enrollments: any[];
    pending_requests: any[];
    history: any[];
  }> {
    const data = await studentRepository.getStudentEnrollmentsAndRequests(studentId);

    const activeEnrollments = data.activeEnrollments.map((r) => ({
      enrollment_id: r.enrollment_id,
      course_id: r.course_id,
      course_code: r.course_code,
      course_title: r.course_title,
      course_type: r.course_type,
      course_status: r.course_status,
      start_date: r.start_date,
      end_date: r.end_date,
      trainer_name: r.trainer_name,
      slot_summary: data.slotSummaries.get(r.course_id) || 'Timetable not set',
      status: r.status,
      source: r.source,
      enrolled_at: r.enrolled_at,
    }));

    const pendingRequests = data.pendingRequests.map((r) => ({
      waitlist_id: r.waitlist_id,
      course_id: r.course_id,
      course_code: r.course_code,
      course_title: r.course_title,
      course_type: r.course_type,
      course_status: r.course_status,
      start_date: r.start_date,
      end_date: r.end_date,
      trainer_name: r.trainer_name,
      slot_summary: data.slotSummaries.get(r.course_id) || 'Timetable not set',
      status: r.status,
      request_source: r.request_source,
      requested_at: r.joined_at,
      position: Number(r.position),
    }));

    const history = data.history.map((r: any) => ({
      id: r.id,
      course_id: r.course_id,
      course_code: r.course_code,
      course_title: r.course_title,
      course_type: r.course_type,
      record_type: r.record_type,
      status: r.status,
      source: r.source,
      trainer_name: r.trainer_name,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      reason: r.reason,
    }));

    return {
      active_enrollments: activeEnrollments,
      pending_requests: pendingRequests,
      history,
    };
  },

  /**
   * Returns weekly timetable slots for student's active enrollments
   * and optionally pending requests.
   */
  async getStudentSchedule(
    studentId: string,
    includePending: boolean
  ): Promise<StudentScheduleSlot[]> {
    return studentRepository.getStudentSchedule(studentId, includePending);
  },
};
