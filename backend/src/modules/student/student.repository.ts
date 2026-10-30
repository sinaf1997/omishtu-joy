import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  StudentCourseItem,
  StudentCourseSlot,
  StudentScheduleSlot,
  WaitlistRequestSource,
} from '../enrollments/enrollments.types.js';
import { buildSlotSummary } from '../courses/courses.repository.js';

export interface RawOpenCourseRow extends RowDataPacket {
  id: string;
  code: string;
  title: string;
  description: string | null;
  course_type: 'major' | 'elective';
  duration_weeks: number | null;
  start_date: string;
  end_date: string;
  capacity: number;
  status: string;
  location: string | null;
  trainer_name: string | null;
  enrolled_count: number;
}

export interface RawCourseSlotRow extends RowDataPacket {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
}

export interface RawStudentEnrollmentRow extends RowDataPacket {
  enrollment_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  course_status: string;
  start_date: string;
  end_date: string;
  trainer_name: string | null;
  status: 'active' | 'completed' | 'dropped' | 'cancelled';
  source: 'direct' | 'waitlist';
  enrolled_at: string;
  dropped_at: string | null;
  drop_reason: string | null;
}

export interface RawStudentWaitlistRow extends RowDataPacket {
  waitlist_id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_type: 'major' | 'elective';
  course_status: string;
  start_date: string;
  end_date: string;
  trainer_name: string | null;
  status: 'waiting' | 'promoted' | 'removed';
  request_source: WaitlistRequestSource;
  joined_at: string;
  resolved_at: string | null;
  removal_reason: string | null;
  position: number;
}

let hasEnsuredWaitlistSchema = false;

export async function ensureWaitlistSchema(): Promise<void> {
  if (hasEnsuredWaitlistSchema) return;
  try {
    const pool = getDatabasePool();
    const [tableCheck] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'waitlist_entries'`
    );
    if (((tableCheck[0] as { count?: number })?.count ?? 0) === 0) return;

    const [colCheck] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'waitlist_entries' AND COLUMN_NAME = 'request_source'`
    );
    if (((colCheck[0] as { count?: number })?.count ?? 0) === 0) {
      console.warn('⚠️ Self-healing: Table "waitlist_entries" lacks "request_source" column. Adding column and index...');
      await pool.query(`
        ALTER TABLE waitlist_entries 
        ADD COLUMN request_source ENUM('course_full', 'student_request') NOT NULL DEFAULT 'course_full' AFTER status
      `);
      try {
        await pool.query(`
          ALTER TABLE waitlist_entries 
          ADD INDEX idx_waitlist_entries_course_status_source (course_id, status, request_source)
        `);
      } catch {
        // index may already exist
      }
    }
    hasEnsuredWaitlistSchema = true;
  } catch (err) {
    console.warn('[ensureWaitlistSchema check warning]:', err);
  }
}

export const studentRepository = {
  /**
   * Fetches open courses with optional search, type filter, weekday filter, and pagination.
   */
  async findOpenCourses(params: {
    page: number;
    limit: number;
    search?: string;
    course_type?: 'major' | 'elective';
    weekday?: number;
  }): Promise<{ courses: RawOpenCourseRow[]; total: number; slotsMap: Map<string, StudentCourseSlot[]> }> {
    const pool = getDatabasePool();
    const whereClauses: string[] = ["c.status = 'open'"];
    const queryParams: unknown[] = [];

    if (params.search && params.search.trim()) {
      whereClauses.push('(c.code LIKE ? OR c.title LIKE ?)');
      const term = `%${params.search.trim()}%`;
      queryParams.push(term, term);
    }

    if (params.course_type) {
      whereClauses.push('c.course_type = ?');
      queryParams.push(params.course_type);
    }

    if (params.weekday) {
      whereClauses.push(
        'EXISTS (SELECT 1 FROM course_schedule_slots css WHERE css.course_id = c.id AND css.day_of_week = ?)'
      );
      queryParams.push(params.weekday);
    }

    const whereSql = whereClauses.join(' AND ');

    // Count total
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM courses c WHERE ${whereSql}`,
      queryParams
    );
    const total = Number(countRows[0]?.total || 0);

    const offset = (params.page - 1) * params.limit;
    const [courseRows] = await pool.query<RawOpenCourseRow[]>(
      `SELECT c.id, c.code, c.title, c.description, c.course_type, c.duration_weeks,
              DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
              c.capacity, c.status, c.location,
              TRIM(st.full_name) as trainer_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count
       FROM courses c
       LEFT JOIN staff st ON c.trainer_id = st.id
       WHERE ${whereSql}
       ORDER BY c.start_date ASC, c.code ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, params.limit, offset]
    );

    const slotsMap = new Map<string, StudentCourseSlot[]>();
    if (courseRows.length > 0) {
      const ids = courseRows.map((c) => c.id);
      const placeholders = ids.map(() => '?').join(',');
      const [slotRows] = await pool.query<RawCourseSlotRow[]>(
        `SELECT id, course_id, day_of_week,
                TIME_FORMAT(start_time, '%H:%i') as start_time,
                TIME_FORMAT(end_time, '%H:%i') as end_time,
                room
         FROM course_schedule_slots
         WHERE course_id IN (${placeholders})
         ORDER BY day_of_week ASC, start_time ASC`,
        ids
      );

      for (const s of slotRows) {
        const arr = slotsMap.get(s.course_id) ?? [];
        arr.push({
          id: s.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room,
        });
        slotsMap.set(s.course_id, arr);
      }
    }

    return { courses: courseRows, total, slotsMap };
  },

  /**
   * Fetches single open course details by id.
   */
  async findOpenCourseById(courseId: string): Promise<{
    course: RawOpenCourseRow | null;
    slots: StudentCourseSlot[];
  }> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<RawOpenCourseRow[]>(
      `SELECT c.id, c.code, c.title, c.description, c.course_type, c.duration_weeks,
              DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
              DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
              c.capacity, c.status, c.location,
              TRIM(st.full_name) as trainer_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrolled_count
       FROM courses c
       LEFT JOIN staff st ON c.trainer_id = st.id
       WHERE c.id = ? AND c.status = 'open'
       LIMIT 1`,
      [courseId]
    );

    if (rows.length === 0) {
      return { course: null, slots: [] };
    }

    const [slotRows] = await pool.query<RawCourseSlotRow[]>(
      `SELECT id, course_id, day_of_week,
              TIME_FORMAT(start_time, '%H:%i') as start_time,
              TIME_FORMAT(end_time, '%H:%i') as end_time,
              room
       FROM course_schedule_slots
       WHERE course_id = ?
       ORDER BY day_of_week ASC, start_time ASC`,
      [courseId]
    );

    return {
      course: rows[0],
      slots: slotRows.map((s) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
      })),
    };
  },

  /**
   * Returns all pending elective waitlist entries with slots for timetable conflict detection.
   */
  async getStudentPendingWaitlistsWithSlots(
    studentId: string,
    connection?: PoolConnection
  ): Promise<
    {
      waitlist_id: string;
      course_id: string;
      course_code: string;
      course_title: string;
      course_type: 'major' | 'elective';
      start_date: string;
      end_date: string;
      slots: { day_of_week: number; start_time: string; end_time: string }[];
    }[]
  > {
    await ensureWaitlistSchema();
    const executor = connection || getDatabasePool();
    let rows: (RowDataPacket & {
      waitlist_id: string;
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
    })[] = [];

    try {
      const [res] = await executor.query<typeof rows>(
        `SELECT w.id as waitlist_id, c.id as course_id, c.code as course_code, c.title as course_title,
                c.course_type,
                DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
                css.id as slot_id, css.day_of_week,
                TIME_FORMAT(css.start_time, '%H:%i') as start_time,
                TIME_FORMAT(css.end_time, '%H:%i') as end_time
         FROM waitlist_entries w
         JOIN courses c ON w.course_id = c.id
         LEFT JOIN course_schedule_slots css ON c.id = css.course_id
         WHERE w.student_id = ?
           AND w.status = 'waiting'
           AND c.status NOT IN ('completed', 'cancelled')
         ORDER BY w.joined_at ASC, css.day_of_week ASC, css.start_time ASC`,
        [studentId]
      );
      rows = res;
    } catch (err) {
      console.error('[getStudentPendingWaitlistsWithSlots query warning]:', err);
      return [];
    }

    const map = new Map<
      string,
      {
        waitlist_id: string;
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
      if (!map.has(r.course_id)) {
        map.set(r.course_id, {
          waitlist_id: r.waitlist_id,
          course_id: r.course_id,
          course_code: r.course_code,
          course_title: r.course_title,
          course_type: r.course_type,
          start_date: r.start_date,
          end_date: r.end_date,
          slots: [],
        });
      }
      if (r.slot_id && r.day_of_week !== null && r.start_time && r.end_time) {
        map.get(r.course_id)!.slots.push({
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
        });
      }
    }

    return Array.from(map.values());
  },

  /**
   * Fetches full student enrollments, pending requests, and decision history.
   */
  async getStudentEnrollmentsAndRequests(studentId: string): Promise<{
    activeEnrollments: RawStudentEnrollmentRow[];
    pendingRequests: RawStudentWaitlistRow[];
    history: RowDataPacket[];
    slotSummaries: Map<string, string>;
  }> {
    await ensureWaitlistSchema();
    const pool = getDatabasePool();

    // 1. Active enrollments
    let activeRows: RawStudentEnrollmentRow[] = [];
    try {
      const [rows] = await pool.query<RawStudentEnrollmentRow[]>(
        `SELECT e.id as enrollment_id, e.course_id, c.code as course_code, c.title as course_title,
                c.course_type, c.status as course_status,
                DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
                TRIM(st.full_name) as trainer_name,
                e.status, e.source, e.enrolled_at, e.dropped_at, e.drop_reason
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN staff st ON c.trainer_id = st.id
         WHERE e.student_id = ? AND e.status = 'active'
         ORDER BY e.enrolled_at DESC`,
        [studentId]
      );
      activeRows = rows;
    } catch (err) {
      console.error('[getStudentEnrollments: Active enrollments query failed]:', err);
    }

    // 2. Pending requests (waiting status) with calculated waitlist position
    let pendingRows: RawStudentWaitlistRow[] = [];
    try {
      const [rows] = await pool.query<RawStudentWaitlistRow[]>(
        `SELECT w.id as waitlist_id, w.course_id, c.code as course_code, c.title as course_title,
                c.course_type, c.status as course_status,
                DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
                TRIM(st.full_name) as trainer_name,
                w.status,
                COALESCE(w.request_source, 'course_full') as request_source,
                w.joined_at, w.resolved_at, w.removal_reason,
                (SELECT COUNT(*) + 1 FROM waitlist_entries w2 
                 WHERE w2.course_id = w.course_id AND w2.status = 'waiting' AND (w2.joined_at < w.joined_at OR (w2.joined_at = w.joined_at AND w2.id < w.id))) as position
         FROM waitlist_entries w
         JOIN courses c ON w.course_id = c.id
         LEFT JOIN staff st ON c.trainer_id = st.id
         WHERE w.student_id = ? AND w.status = 'waiting'
         ORDER BY w.joined_at ASC`,
        [studentId]
      );
      pendingRows = rows;
    } catch (err) {
      console.error('[getStudentEnrollments: Pending waitlist query failed]:', err);
    }

    // 3. History: Dropped/Completed enrollments & Promoted/Removed waitlist entries
    let historyRows: RowDataPacket[] = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT e.id, e.course_id, c.code as course_code, c.title as course_title,
                c.course_type, 'enrollment' as record_type,
                e.status, e.source, e.enrolled_at as created_at, e.dropped_at as resolved_at,
                e.drop_reason as reason, TRIM(st.full_name) as trainer_name
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN staff st ON c.trainer_id = st.id
         WHERE e.student_id = ? AND e.status IN ('dropped', 'completed')
         UNION ALL
         SELECT w.id, w.course_id, c.code as course_code, c.title as course_title,
                c.course_type, 'waitlist' as record_type,
                w.status,
                COALESCE(w.request_source, 'course_full') as source,
                w.joined_at as created_at, w.resolved_at,
                w.removal_reason as reason, TRIM(st.full_name) as trainer_name
         FROM waitlist_entries w
         JOIN courses c ON w.course_id = c.id
         LEFT JOIN staff st ON c.trainer_id = st.id
         WHERE w.student_id = ? AND w.status IN ('promoted', 'removed')
         ORDER BY resolved_at DESC`,
        [studentId, studentId]
      );
      historyRows = rows;
    } catch (err) {
      console.error('[getStudentEnrollments: History query failed]:', err);
    }

    // Collect all unique course ids to compute slot summaries
    const courseIds = new Set<string>();
    activeRows.forEach((r) => courseIds.add(r.course_id));
    pendingRows.forEach((r) => courseIds.add(r.course_id));
    historyRows.forEach((r) => courseIds.add(r.course_id));

    const slotSummaries = new Map<string, string>();
    if (courseIds.size > 0) {
      try {
        const ids = Array.from(courseIds);
        const placeholders = ids.map(() => '?').join(',');
        const [slots] = await pool.query<RawCourseSlotRow[]>(
          `SELECT course_id, day_of_week,
                  TIME_FORMAT(start_time, '%H:%i') as start_time,
                  TIME_FORMAT(end_time, '%H:%i') as end_time
           FROM course_schedule_slots
           WHERE course_id IN (${placeholders})`,
          ids
        );

        const grouped = new Map<string, { day_of_week: number; start_time: string; end_time: string }[]>();
        for (const s of slots) {
          const arr = grouped.get(s.course_id) ?? [];
          arr.push({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time });
          grouped.set(s.course_id, arr);
        }

        for (const id of ids) {
          slotSummaries.set(id, buildSlotSummary(grouped.get(id) || []));
        }
      } catch (err) {
        console.error('[getStudentEnrollments: Slot summaries query failed]:', err);
      }
    }

    return { activeEnrollments: activeRows, pendingRequests: pendingRows, history: historyRows, slotSummaries };
  },

  /**
   * Fetches weekly timetable schedule slots for student's active enrollments
   * and optionally pending requests with pending=true.
   */
  async getStudentSchedule(
    studentId: string,
    includePending: boolean
  ): Promise<StudentScheduleSlot[]> {
    await ensureWaitlistSchema();
    const pool = getDatabasePool();

    let sql = `
      SELECT css.id as slot_id, c.id as course_id, c.code as course_code, c.title as course_title,
             c.course_type, TRIM(st.full_name) as trainer_name,
             css.day_of_week,
             TIME_FORMAT(css.start_time, '%H:%i') as start_time,
             TIME_FORMAT(css.end_time, '%H:%i') as end_time,
             css.room,
             DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
             DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
             FALSE as pending
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN course_schedule_slots css ON c.id = css.course_id
      LEFT JOIN staff st ON c.trainer_id = st.id
      WHERE e.student_id = ? AND e.status = 'active' AND c.status NOT IN ('cancelled')
    `;

    const params: unknown[] = [studentId];

    if (includePending) {
      sql += `
        UNION ALL
        SELECT css.id as slot_id, c.id as course_id, c.code as course_code, c.title as course_title,
               c.course_type, TRIM(st.full_name) as trainer_name,
               css.day_of_week,
               TIME_FORMAT(css.start_time, '%H:%i') as start_time,
               TIME_FORMAT(css.end_time, '%H:%i') as end_time,
               css.room,
               DATE_FORMAT(c.start_date, '%Y-%m-%d') as start_date,
               DATE_FORMAT(c.end_date, '%Y-%m-%d') as end_date,
               TRUE as pending
        FROM waitlist_entries w
        JOIN courses c ON w.course_id = c.id
        JOIN course_schedule_slots css ON c.id = css.course_id
        LEFT JOIN staff st ON c.trainer_id = st.id
        WHERE w.student_id = ? AND w.status = 'waiting' AND c.status NOT IN ('cancelled')
      `;
      params.push(studentId);
    }

    sql += ` ORDER BY day_of_week ASC, start_time ASC`;

    try {
      const [rows] = await pool.query<(StudentScheduleSlot & RowDataPacket)[]>(sql, params);
      return rows.map((r) => ({
        slot_id: r.slot_id,
        course_id: r.course_id,
        course_code: r.course_code,
        course_title: r.course_title,
        course_type: r.course_type,
        trainer_name: r.trainer_name,
        day_of_week: Number(r.day_of_week),
        start_time: r.start_time,
        end_time: r.end_time,
        room: r.room,
        start_date: r.start_date,
        end_date: r.end_date,
        pending: Boolean(r.pending),
      }));
    } catch (err) {
      console.error('[getStudentSchedule query failed]:', err);
      return [];
    }
  },
};
