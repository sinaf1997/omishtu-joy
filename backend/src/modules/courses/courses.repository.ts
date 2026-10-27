import { RowDataPacket } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  CourseRecord,
  CourseScheduleSlotRecord,
  CourseWithDetails,
  CourseFilter,
  CourseStats,
  TrainerOption,
  ConflictResult,
  CourseScheduleSlotInput,
  CourseStatus,
} from './courses.types.js';

const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

const DAY_FULL_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

/**
 * Builds a readable slot summary, e.g. "Mon, Wed 09:00-11:00"
 */
export function buildSlotSummary(slots: { day_of_week: number; start_time: string; end_time: string }[]): string {
  if (!slots || slots.length === 0) return 'No timetable set';

  // Group by time range
  const map = new Map<string, number[]>();
  for (const s of slots) {
    const start = s.start_time.substring(0, 5);
    const end = s.end_time.substring(0, 5);
    const timeKey = `${start}-${end}`;
    const days = map.get(timeKey) ?? [];
    days.push(s.day_of_week);
    map.set(timeKey, days);
  }

  const parts: string[] = [];
  for (const [timeKey, days] of map.entries()) {
    days.sort((a, b) => a - b);
    const dayStr = days.map((d) => DAY_NAMES[d] || `Day ${d}`).join(', ');
    parts.push(`${dayStr} ${timeKey}`);
  }

  return parts.join('; ');
}

export const coursesRepository = {
  async findCourseByCode(code: string, excludeId?: string): Promise<CourseRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<CourseRecord[]>(
      `SELECT * FROM courses WHERE code = ? ${excludeId ? 'AND id <> ?' : ''} LIMIT 1`,
      excludeId ? [code.toUpperCase(), excludeId] : [code.toUpperCase()]
    );
    return rows[0] || null;
  },

  async findCourseById(id: string): Promise<CourseRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<CourseRecord[]>(
      'SELECT * FROM courses WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async findSlotsByCourseId(courseId: string): Promise<CourseScheduleSlotRecord[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<CourseScheduleSlotRecord[]>(
      `SELECT id, course_id, day_of_week, 
              TIME_FORMAT(start_time, '%H:%i') AS start_time,
              TIME_FORMAT(end_time, '%H:%i') AS end_time,
              room, created_at, updated_at
       FROM course_schedule_slots 
       WHERE course_id = ? 
       ORDER BY day_of_week ASC, start_time ASC`,
      [courseId]
    );
    return rows;
  },

  async listCourses(filter: CourseFilter): Promise<{ courses: CourseWithDetails[]; total: number }> {
    const pool = getDatabasePool();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.search) {
      conditions.push('(c.code LIKE ? OR c.title LIKE ?)');
      const searchParam = `%${filter.search.trim()}%`;
      params.push(searchParam, searchParam);
    }

    if (filter.course_type) {
      conditions.push('c.course_type = ?');
      params.push(filter.course_type);
    }

    if (filter.status) {
      conditions.push('c.status = ?');
      params.push(filter.status);
    }

    if (filter.trainer_id) {
      conditions.push('c.trainer_id = ?');
      params.push(filter.trainer_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM courses c ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    // Fetch courses with trainer name
    const [rows] = await pool.query<(CourseRecord & { trainer_name: string | null })[]>(
      `SELECT c.*, s.full_name AS trainer_name
       FROM courses c
       LEFT JOIN staff s ON c.trainer_id = s.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    if (rows.length === 0) {
      return { courses: [], total };
    }

    // Fetch slots for all fetched courses in batch
    const courseIds = rows.map((r) => r.id);
    const [slotsRows] = await pool.query<CourseScheduleSlotRecord[]>(
      `SELECT id, course_id, day_of_week,
              TIME_FORMAT(start_time, '%H:%i') AS start_time,
              TIME_FORMAT(end_time, '%H:%i') AS end_time,
              room, created_at, updated_at
       FROM course_schedule_slots
       WHERE course_id IN (?)
       ORDER BY day_of_week ASC, start_time ASC`,
      [courseIds]
    );

    const slotsByCourseId = new Map<string, CourseScheduleSlotRecord[]>();
    for (const slot of slotsRows) {
      const list = slotsByCourseId.get(slot.course_id) || [];
      list.push(slot);
      slotsByCourseId.set(slot.course_id, list);
    }

    const courses: CourseWithDetails[] = rows.map((r) => {
      const slots = slotsByCourseId.get(r.id) || [];
      return {
        ...r,
        enrolled_count: 0, // Mocked to 0 until enrollment sprint (S3 Part 2)
        slot_summary: buildSlotSummary(slots),
        slots,
      };
    });

    return { courses, total };
  },

  async getStats(): Promise<CourseStats> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN course_type = 'major' THEN 1 ELSE 0 END) AS major,
        SUM(CASE WHEN course_type = 'elective' THEN 1 ELSE 0 END) AS elective,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS \`open\`
      FROM courses
    `);

    const row = rows[0] || {};
    return {
      total: Number(row.total || 0),
      major: Number(row.major || 0),
      elective: Number(row.elective || 0),
      open: Number(row.open || 0),
    };
  },

  async listTrainers(): Promise<TrainerOption[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<TrainerOption[]>(`
      SELECT s.id, s.full_name
      FROM staff s
      JOIN roles r ON s.role_id = r.id
      WHERE r.name = 'trainer' AND s.is_active = 1
      ORDER BY s.full_name ASC
    `);
    return rows;
  },

  async findScheduleConflict(params: {
    startDate: string;
    endDate: string;
    trainerId?: string | null;
    slots: CourseScheduleSlotInput[];
    excludeCourseId?: string;
  }): Promise<ConflictResult | null> {
    const pool = getDatabasePool();

    for (const slot of params.slots) {
      const roomParam = slot.room ? slot.room.trim() : null;
      const trainerParam = params.trainerId || null;

      // Only check if trainer or room is specified
      if (!trainerParam && !roomParam) {
        continue;
      }

      const [conflicts] = await pool.query<RowDataPacket[]>(
        `SELECT
           c.id AS conflicting_course_id,
           c.code AS conflicting_course_code,
           c.title AS conflicting_course_title,
           c.trainer_id AS conflicting_trainer_id,
           css.day_of_week,
           TIME_FORMAT(css.start_time, '%H:%i') AS start_time,
           TIME_FORMAT(css.end_time, '%H:%i') AS end_time,
           css.room
         FROM courses c
         JOIN course_schedule_slots css ON c.id = css.course_id
         WHERE c.status NOT IN ('cancelled', 'completed')
           AND c.start_date <= ? AND c.end_date >= ?
           AND (? IS NULL OR c.id <> ?)
           AND css.day_of_week = ?
           AND css.start_time < ? AND css.end_time > ?
           AND (
             (? IS NOT NULL AND c.trainer_id IS NOT NULL AND c.trainer_id = ?)
             OR
             (? IS NOT NULL AND css.room IS NOT NULL AND TRIM(css.room) <> '' AND LOWER(css.room) = LOWER(?))
           )
         LIMIT 1`,
        [
          params.endDate,
          params.startDate,
          params.excludeCourseId || null,
          params.excludeCourseId || null,
          slot.day_of_week,
          slot.end_time,
          slot.start_time,
          trainerParam,
          trainerParam,
          roomParam,
          roomParam,
        ]
      );

      if (conflicts.length > 0) {
        const row = conflicts[0];
        const dayName = DAY_FULL_NAMES[slot.day_of_week] || `Day ${slot.day_of_week}`;
        const timeSpan = `${row.start_time} - ${row.end_time}`;
        const isTrainerConflict = trainerParam && row.conflicting_trainer_id === trainerParam;

        if (isTrainerConflict) {
          return {
            conflicting_course_code: row.conflicting_course_code,
            conflicting_course_title: row.conflicting_course_title,
            conflict_type: 'trainer',
            day_of_week: slot.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            detail: `Schedule conflict: Trainer is already scheduled for course '${row.conflicting_course_code}' on ${dayName} (${timeSpan})`,
          };
        } else {
          return {
            conflicting_course_code: row.conflicting_course_code,
            conflicting_course_title: row.conflicting_course_title,
            conflict_type: 'room',
            day_of_week: slot.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            detail: `Schedule conflict: Room '${row.room}' is already booked by course '${row.conflicting_course_code}' on ${dayName} (${timeSpan})`,
          };
        }
      }
    }

    return null;
  },

  async createCourseWithSlots(
    course: {
      id: string;
      code: string;
      title: string;
      description?: string | null;
      course_type: string;
      duration_weeks: number | null;
      start_date: string;
      end_date: string;
      capacity: number;
      trainer_id?: string | null;
      location?: string | null;
      status: CourseStatus;
      created_by_staff_id?: string | null;
    },
    slots: {
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      room?: string | null;
    }[]
  ): Promise<void> {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO courses (
           id, code, title, description, course_type, duration_weeks,
           start_date, end_date, capacity, trainer_id, location,
           status, created_by_staff_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course.id,
          course.code,
          course.title,
          course.description || null,
          course.course_type,
          course.duration_weeks,
          course.start_date,
          course.end_date,
          course.capacity,
          course.trainer_id || null,
          course.location || null,
          course.status,
          course.created_by_staff_id || null,
        ]
      );

      for (const slot of slots) {
        await connection.query(
          `INSERT INTO course_schedule_slots (
             id, course_id, day_of_week, start_time, end_time, room
           ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            slot.id,
            course.id,
            slot.day_of_week,
            slot.start_time,
            slot.end_time,
            slot.room || null,
          ]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async updateCourseWithSlots(
    courseId: string,
    updates: Partial<{
      code: string;
      title: string;
      description: string | null;
      course_type: string;
      duration_weeks: number | null;
      start_date: string;
      end_date: string;
      capacity: number;
      trainer_id: string | null;
      location: string | null;
    }>,
    slots?: {
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      room?: string | null;
    }[]
  ): Promise<void> {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.code !== undefined) {
        fields.push('code = ?');
        values.push(updates.code);
      }
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.course_type !== undefined) {
        fields.push('course_type = ?');
        values.push(updates.course_type);
      }
      if (updates.duration_weeks !== undefined) {
        fields.push('duration_weeks = ?');
        values.push(updates.duration_weeks);
      }
      if (updates.start_date !== undefined) {
        fields.push('start_date = ?');
        values.push(updates.start_date);
      }
      if (updates.end_date !== undefined) {
        fields.push('end_date = ?');
        values.push(updates.end_date);
      }
      if (updates.capacity !== undefined) {
        fields.push('capacity = ?');
        values.push(updates.capacity);
      }
      if (updates.trainer_id !== undefined) {
        fields.push('trainer_id = ?');
        values.push(updates.trainer_id);
      }
      if (updates.location !== undefined) {
        fields.push('location = ?');
        values.push(updates.location);
      }

      if (fields.length > 0) {
        values.push(courseId);
        await connection.query(
          `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      if (slots !== undefined) {
        await connection.query(
          'DELETE FROM course_schedule_slots WHERE course_id = ?',
          [courseId]
        );

        for (const slot of slots) {
          await connection.query(
            `INSERT INTO course_schedule_slots (
               id, course_id, day_of_week, start_time, end_time, room
             ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              slot.id,
              courseId,
              slot.day_of_week,
              slot.start_time,
              slot.end_time,
              slot.room || null,
            ]
          );
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async updateCourseStatus(courseId: string, status: CourseStatus): Promise<void> {
    const pool = getDatabasePool();
    await pool.query('UPDATE courses SET status = ? WHERE id = ?', [status, courseId]);
  },
};
