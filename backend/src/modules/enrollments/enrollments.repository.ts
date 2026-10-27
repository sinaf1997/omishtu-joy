import crypto from 'crypto';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import { buildSlotSummary } from '../courses/courses.repository.js';
import {
  EnrollmentRecord,
  WaitlistRecord,
  RosterEnrolledStudent,
  RosterWaitlistedStudent,
  StudentEnrollmentItem,
  StudentWaitlistItem,
  EnrollmentListItem,
  WaitlistSummaryCourse,
  EnrollmentStatus,
  WaitlistStatus,
} from './enrollments.types.js';

interface CountRow extends RowDataPacket {
  count: number;
}

interface StudentUserRow extends RowDataPacket {
  id: string; // student id
  student_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: number;
}

interface CourseSlotRow extends RowDataPacket {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
}

interface CourseRow extends RowDataPacket {
  id: string;
  code: string;
  title: string;
  course_type: 'major' | 'elective';
  duration_weeks: number | null;
  start_date: string;
  end_date: string;
  capacity: number;
  status: string;
  trainer_id: string | null;
  location: string | null;
}

interface ActiveEnrollmentWithSlotsRow extends RowDataPacket {
  enrollment_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  start_date: string;
  end_date: string;
  slot_id: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
}

export const enrollmentsRepository = {
  async getEnrolledCountByCourseId(courseId: string, connection?: PoolConnection): Promise<number> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status = 'active'`,
      [courseId]
    );
    return Number(rows[0]?.count ?? 0);
  },

  async getWaitlistCountByCourseId(courseId: string, connection?: PoolConnection): Promise<number> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM waitlist_entries WHERE course_id = ? AND status = 'waiting'`,
      [courseId]
    );
    return Number(rows[0]?.count ?? 0);
  },

  async findEnrollmentById(id: string, connection?: PoolConnection): Promise<(EnrollmentRecord & RowDataPacket) | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<(EnrollmentRecord & RowDataPacket)[]>(
      `SELECT * FROM enrollments WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findWaitlistEntryById(id: string, connection?: PoolConnection): Promise<(WaitlistRecord & RowDataPacket) | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<(WaitlistRecord & RowDataPacket)[]>(
      `SELECT * FROM waitlist_entries WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findEnrollmentByStudentAndCourse(
    studentId: string,
    courseId: string,
    connection?: PoolConnection
  ): Promise<(EnrollmentRecord & RowDataPacket) | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<(EnrollmentRecord & RowDataPacket)[]>(
      `SELECT * FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1`,
      [studentId, courseId]
    );
    return rows[0] || null;
  },

  async findWaitlistByStudentAndCourse(
    studentId: string,
    courseId: string,
    connection?: PoolConnection
  ): Promise<(WaitlistRecord & RowDataPacket) | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<(WaitlistRecord & RowDataPacket)[]>(
      `SELECT * FROM waitlist_entries WHERE student_id = ? AND course_id = ? LIMIT 1`,
      [studentId, courseId]
    );
    return rows[0] || null;
  },

  async findStudentById(studentId: string, connection?: PoolConnection): Promise<StudentUserRow | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<StudentUserRow[]>(
      `SELECT s.id, s.student_code,
              TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as full_name,
              s.email, s.phone, s.is_active
       FROM students s
       WHERE s.id = ?
       LIMIT 1`,
      [studentId]
    );
    return rows[0] || null;
  },

  async findCourseWithSlots(
    courseId: string,
    connection?: PoolConnection
  ): Promise<{ course: CourseRow | null; slots: CourseSlotRow[] }> {
    const executor = connection || getDatabasePool();
    const [courseRows] = await executor.query<CourseRow[]>(
      `SELECT id, code, title, course_type, duration_weeks,
              DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
              capacity, status, trainer_id, location
       FROM courses
       WHERE id = ?
       LIMIT 1`,
      [courseId]
    );

    if (courseRows.length === 0) {
      return { course: null, slots: [] };
    }

    const [slotRows] = await executor.query<CourseSlotRow[]>(
      `SELECT id, course_id, day_of_week, start_time, end_time, room
       FROM course_schedule_slots
       WHERE course_id = ?
       ORDER BY day_of_week ASC, start_time ASC`,
      [courseId]
    );

    return { course: courseRows[0], slots: slotRows };
  },

  async lockCourseForUpdate(courseId: string, connection: PoolConnection): Promise<CourseRow | null> {
    const [rows] = await connection.query<CourseRow[]>(
      `SELECT id, code, title, course_type, duration_weeks,
              DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
              capacity, status, trainer_id, location
       FROM courses
       WHERE id = ?
       FOR UPDATE`,
      [courseId]
    );
    return rows[0] || null;
  },

  async getActiveEnrollmentsWithSlots(
    studentId: string,
    connection?: PoolConnection
  ): Promise<
    {
      enrollment_id: string;
      course_id: string;
      course_code: string;
      course_title: string;
      course_type: 'major' | 'elective';
      start_date: string;
      end_date: string;
      slots: { day_of_week: number; start_time: string; end_time: string }[];
    }[]
  > {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<ActiveEnrollmentWithSlotsRow[]>(
      `SELECT e.id as enrollment_id, c.id as course_id, c.code as course_code, c.title as course_title,
              c.course_type,
              DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
              css.id as slot_id, css.day_of_week, css.start_time, css.end_time
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN course_schedule_slots css ON c.id = css.course_id
       WHERE e.student_id = ?
         AND e.status = 'active'
         AND c.status NOT IN ('completed', 'cancelled')
       ORDER BY c.code ASC, css.day_of_week ASC, css.start_time ASC`,
      [studentId]
    );

    const map = new Map<
      string,
      {
        enrollment_id: string;
        course_id: string;
        course_code: string;
        course_title: string;
        course_type: 'major' | 'elective';
        start_date: string;
        end_date: string;
        slots: { day_of_week: number; start_time: string; end_time: string }[];
      }
    >();

    for (const r of rows) {
      let entry = map.get(r.course_id);
      if (!entry) {
        entry = {
          enrollment_id: r.enrollment_id,
          course_id: r.course_id,
          course_code: r.course_code,
          course_title: r.course_title,
          course_type: r.course_type,
          start_date: r.start_date,
          end_date: r.end_date,
          slots: [],
        };
        map.set(r.course_id, entry);
      }
      if (r.slot_id && r.day_of_week !== null && r.start_time && r.end_time) {
        entry.slots.push({
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
        });
      }
    }

    return Array.from(map.values());
  },

  async createOrReactivateEnrollment(
    params: {
      student_id: string;
      course_id: string;
      source: 'direct' | 'waitlist';
      staff_id?: string;
    },
    connection: PoolConnection
  ): Promise<EnrollmentRecord> {
    const existing = await this.findEnrollmentByStudentAndCourse(params.student_id, params.course_id, connection);
    if (existing) {
      await connection.query(
        `UPDATE enrollments
         SET status = 'active',
             enrolled_at = CURRENT_TIMESTAMP,
             enrolled_by_staff_id = ?,
             source = ?,
             dropped_at = NULL,
             drop_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [params.staff_id || null, params.source, existing.id]
      );
      const [updated] = await connection.query<(EnrollmentRecord & RowDataPacket)[]>(
        `SELECT * FROM enrollments WHERE id = ? LIMIT 1`,
        [existing.id]
      );
      return updated[0];
    } else {
      const id = crypto.randomUUID();
      await connection.query(
        `INSERT INTO enrollments (id, student_id, course_id, status, enrolled_at, enrolled_by_staff_id, source)
         VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, ?, ?)`,
        [id, params.student_id, params.course_id, params.staff_id || null, params.source]
      );
      const [created] = await connection.query<(EnrollmentRecord & RowDataPacket)[]>(
        `SELECT * FROM enrollments WHERE id = ? LIMIT 1`,
        [id]
      );
      return created[0];
    }
  },

  async createOrReactivateWaitlist(
    params: {
      student_id: string;
      course_id: string;
      staff_id?: string;
    },
    connection: PoolConnection
  ): Promise<WaitlistRecord> {
    const existing = await this.findWaitlistByStudentAndCourse(params.student_id, params.course_id, connection);
    if (existing) {
      await connection.query(
        `UPDATE waitlist_entries
         SET status = 'waiting',
             joined_at = CURRENT_TIMESTAMP,
             added_by_staff_id = ?,
             resolved_at = NULL,
             resolved_by_staff_id = NULL,
             removal_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [params.staff_id || null, existing.id]
      );
      const [updated] = await connection.query<(WaitlistRecord & RowDataPacket)[]>(
        `SELECT * FROM waitlist_entries WHERE id = ? LIMIT 1`,
        [existing.id]
      );
      return updated[0];
    } else {
      const id = crypto.randomUUID();
      await connection.query(
        `INSERT INTO waitlist_entries (id, student_id, course_id, status, added_by_staff_id, joined_at)
         VALUES (?, ?, ?, 'waiting', ?, CURRENT_TIMESTAMP)`,
        [id, params.student_id, params.course_id, params.staff_id || null]
      );
      const [created] = await connection.query<(WaitlistRecord & RowDataPacket)[]>(
        `SELECT * FROM waitlist_entries WHERE id = ? LIMIT 1`,
        [id]
      );
      return created[0];
    }
  },

  async dropEnrollment(
    enrollmentId: string,
    reason: string,
    connection?: PoolConnection
  ): Promise<EnrollmentRecord | null> {
    const executor = connection || getDatabasePool();
    await executor.query(
      `UPDATE enrollments
       SET status = 'dropped',
           dropped_at = CURRENT_TIMESTAMP,
           drop_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reason, enrollmentId]
    );
    const [rows] = await executor.query<(EnrollmentRecord & RowDataPacket)[]>(
      `SELECT * FROM enrollments WHERE id = ? LIMIT 1`,
      [enrollmentId]
    );
    return rows[0] || null;
  },

  async resolveWaitlistEntry(
    waitlistEntryId: string,
    status: 'promoted' | 'removed',
    staffId?: string,
    removalReason?: string,
    connection?: PoolConnection
  ): Promise<WaitlistRecord | null> {
    const executor = connection || getDatabasePool();
    await executor.query(
      `UPDATE waitlist_entries
       SET status = ?,
           resolved_at = CURRENT_TIMESTAMP,
           resolved_by_staff_id = ?,
           removal_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, staffId || null, removalReason || null, waitlistEntryId]
    );
    const [rows] = await executor.query<(WaitlistRecord & RowDataPacket)[]>(
      `SELECT * FROM waitlist_entries WHERE id = ? LIMIT 1`,
      [waitlistEntryId]
    );
    return rows[0] || null;
  },

  async getWaitlistPosition(
    waitlistEntryId: string,
    courseId: string,
    connection?: PoolConnection
  ): Promise<number | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<(RowDataPacket & { position: number })[]>(
      `SELECT position FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at ASC) as position
         FROM waitlist_entries
         WHERE course_id = ? AND status = 'waiting'
       ) ranked WHERE id = ?`,
      [courseId, waitlistEntryId]
    );
    return rows[0]?.position ?? null;
  },

  async getOldestWaitingEntry(
    courseId: string,
    connection?: PoolConnection
  ): Promise<(WaitlistRecord & RowDataPacket) | null> {
    const executor = connection || getDatabasePool();
    const [rows] = await executor.query<(WaitlistRecord & RowDataPacket)[]>(
      `SELECT * FROM waitlist_entries
       WHERE course_id = ? AND status = 'waiting'
       ORDER BY joined_at ASC
       LIMIT 1`,
      [courseId]
    );
    return rows[0] || null;
  },

  async getCourseRoster(courseId: string): Promise<{
    enrolled: RosterEnrolledStudent[];
    waitlist: RosterWaitlistedStudent[];
  }> {
    const pool = getDatabasePool();

    // Enrolled active students
    const [enrolledRows] = await pool.query<(RosterEnrolledStudent & RowDataPacket)[]>(
      `SELECT e.id, e.student_id, s.student_code,
              TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as full_name,
              s.email, s.phone,
              e.status, e.enrolled_at, e.source, e.dropped_at, e.drop_reason
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       WHERE e.course_id = ? AND e.status = 'active'
       ORDER BY e.enrolled_at ASC`,
      [courseId]
    );

    // Waiting students ordered by joined_at ASC with position
    const [waitlistRows] = await pool.query<(RosterWaitlistedStudent & RowDataPacket)[]>(
      `SELECT w.id, w.student_id, s.student_code,
              TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as full_name,
              s.email, s.phone,
              w.status, w.joined_at, w.removal_reason,
              ROW_NUMBER() OVER (ORDER BY w.joined_at ASC) as position
       FROM waitlist_entries w
       JOIN students s ON w.student_id = s.id
       WHERE w.course_id = ? AND w.status = 'waiting'
       ORDER BY w.joined_at ASC`,
      [courseId]
    );

    return {
      enrolled: enrolledRows,
      waitlist: waitlistRows,
    };
  },

  async getStudentEnrollmentHistory(studentId: string): Promise<{
    enrollments: StudentEnrollmentItem[];
    waitlist: StudentWaitlistItem[];
  }> {
    const pool = getDatabasePool();

    // Fetch enrollments with course details
    const [enrollmentRows] = await pool.query<(RowDataPacket & {
      id: string;
      course_id: string;
      course_code: string;
      course_title: string;
      course_type: 'major' | 'elective';
      course_status: string;
      start_date: string;
      end_date: string;
      status: EnrollmentStatus;
      source: 'direct' | 'waitlist';
      enrolled_at: string;
      dropped_at: string | null;
      drop_reason: string | null;
    })[]>(
      `SELECT e.id, c.id as course_id, c.code as course_code, c.title as course_title,
              c.course_type, c.status as course_status,
              DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
              e.status, e.source, e.enrolled_at, e.dropped_at, e.drop_reason
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    // Fetch waitlist entries
    const [waitlistRows] = await pool.query<(RowDataPacket & {
      id: string;
      course_id: string;
      course_code: string;
      course_title: string;
      course_type: 'major' | 'elective';
      course_status: string;
      start_date: string;
      end_date: string;
      status: WaitlistStatus;
      joined_at: string;
    })[]>(
      `SELECT w.id, c.id as course_id, c.code as course_code, c.title as course_title,
              c.course_type, c.status as course_status,
              DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
              w.status, w.joined_at
       FROM waitlist_entries w
       JOIN courses c ON w.course_id = c.id
       WHERE w.student_id = ? AND w.status = 'waiting'
       ORDER BY w.joined_at ASC`,
      [studentId]
    );

    // Fetch slots for each course to compute slot_summary
    const courseIds = new Set<string>();
    enrollmentRows.forEach((r) => courseIds.add(r.course_id));
    waitlistRows.forEach((r) => courseIds.add(r.course_id));

    const slotMap = new Map<string, { day_of_week: number; start_time: string; end_time: string }[]>();
    if (courseIds.size > 0) {
      const idsArray = Array.from(courseIds);
      const placeholders = idsArray.map(() => '?').join(',');
      const [slots] = await pool.query<CourseSlotRow[]>(
        `SELECT course_id, day_of_week, start_time, end_time FROM course_schedule_slots WHERE course_id IN (${placeholders})`,
        idsArray
      );
      for (const s of slots) {
        const arr = slotMap.get(s.course_id) ?? [];
        arr.push({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time });
        slotMap.set(s.course_id, arr);
      }
    }

    const enrollments: StudentEnrollmentItem[] = enrollmentRows.map((r) => ({
      id: r.id,
      course_id: r.course_id,
      course_code: r.course_code,
      course_title: r.course_title,
      course_type: r.course_type,
      course_status: r.course_status,
      start_date: r.start_date,
      end_date: r.end_date,
      slot_summary: buildSlotSummary(slotMap.get(r.course_id) || []),
      status: r.status,
      source: r.source,
      enrolled_at: r.enrolled_at,
      dropped_at: r.dropped_at,
      drop_reason: r.drop_reason,
    }));

    const waitlist: StudentWaitlistItem[] = [];
    for (let i = 0; i < waitlistRows.length; i++) {
      const r = waitlistRows[i];
      const position = await this.getWaitlistPosition(r.id, r.course_id);
      waitlist.push({
        id: r.id,
        course_id: r.course_id,
        course_code: r.course_code,
        course_title: r.course_title,
        course_type: r.course_type,
        course_status: r.course_status,
        start_date: r.start_date,
        end_date: r.end_date,
        slot_summary: buildSlotSummary(slotMap.get(r.course_id) || []),
        status: r.status,
        joined_at: r.joined_at,
        position: position ?? i + 1,
      });
    }

    return { enrollments, waitlist };
  },

  async listEnrollments(params: {
    page: number;
    limit: number;
    student_id?: string;
    course_id?: string;
    status?: EnrollmentStatus;
    search?: string;
  }): Promise<{ items: EnrollmentListItem[]; total: number }> {
    const pool = getDatabasePool();
    const whereClauses: string[] = [];
    const values: any[] = [];

    if (params.student_id) {
      whereClauses.push('e.student_id = ?');
      values.push(params.student_id);
    }
    if (params.course_id) {
      whereClauses.push('e.course_id = ?');
      values.push(params.course_id);
    }
    if (params.status) {
      whereClauses.push('e.status = ?');
      values.push(params.status);
    }
    if (params.search) {
      whereClauses.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_code LIKE ? OR c.code LIKE ? OR c.title LIKE ?)');
      const term = `%${params.search}%`;
      values.push(term, term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as count
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       JOIN courses c ON e.course_id = c.id
       ${whereSql}`,
      values
    );
    const total = Number(countRows[0]?.count ?? 0);

    const offset = (params.page - 1) * params.limit;
    const [rows] = await pool.query<(EnrollmentListItem & RowDataPacket)[]>(
      `SELECT e.id, e.student_id, s.student_code,
              TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as student_name,
              e.course_id, c.code as course_code, c.title as course_title,
              c.course_type, e.status, e.source, e.enrolled_at, e.dropped_at, e.drop_reason
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       JOIN courses c ON e.course_id = c.id
       ${whereSql}
       ORDER BY e.enrolled_at DESC
       LIMIT ? OFFSET ?`,
      [...values, params.limit, offset]
    );

    return { items: rows, total };
  },

  async getWaitlistSummary(): Promise<WaitlistSummaryCourse[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(WaitlistSummaryCourse & RowDataPacket)[]>(
      `SELECT c.id as course_id, c.code as course_code, c.title as course_title,
              c.course_type, c.capacity,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count,
              COUNT(w.id) as waiting_count,
              MIN(w.joined_at) as oldest_waiting_at
       FROM waitlist_entries w
       JOIN courses c ON w.course_id = c.id
       WHERE w.status = 'waiting'
       GROUP BY c.id, c.code, c.title, c.course_type, c.capacity
       ORDER BY waiting_count DESC, oldest_waiting_at ASC`
    );
    return rows;
  },

  async handleCourseStatusChange(courseId: string, newStatus: string): Promise<void> {
    const pool = getDatabasePool();
    if (newStatus === 'cancelled') {
      await pool.query(
        `UPDATE enrollments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND status = 'active'`,
        [courseId]
      );
      await pool.query(
        `UPDATE waitlist_entries
         SET status = 'removed', removal_reason = 'Course cancelled', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE course_id = ? AND status = 'waiting'`,
        [courseId]
      );
    } else if (newStatus === 'completed') {
      await pool.query(
        `UPDATE enrollments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND status = 'active'`,
        [courseId]
      );
    }
  },
};
