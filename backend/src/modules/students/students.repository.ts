import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  StudentRecord,
  CreateStudentData,
  StudentStats,
} from './students.types.js';

export interface ListStudentFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class StudentsRepository {
  async findStudentByCode(studentCode: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT id, student_code, password_hash, must_reset_password, is_active,
              last_login_at, created_at, updated_at
       FROM students
       WHERE UPPER(student_code) = ?
       LIMIT 1`,
      [studentCode.toUpperCase().trim()]
    );
    return rows.length > 0 ? (rows[0] as StudentRecord) : null;
  }

  async findStudentById(id: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT id, student_code, password_hash, must_reset_password, is_active,
              last_login_at, created_at, updated_at
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as StudentRecord) : null;
  }

  async createStudent(data: CreateStudentData): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `INSERT INTO students (
         id, student_code, password_hash, must_reset_password, is_active
       ) VALUES (?, ?, ?, 0, 1)`,
      [data.id, data.studentCode.trim().toUpperCase(), data.passwordHash]
    );
  }

  async listStudentsPaginated(filters: ListStudentFilters): Promise<{ students: StudentRecord[]; total: number }> {
    const pool = getDatabasePool();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push('UPPER(student_code) LIKE ?');
      params.push(`%${filters.search.toUpperCase().trim()}%`);
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push('is_active = ?');
      params.push(filters.status === 'active' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM students ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT id, student_code, password_hash, must_reset_password, is_active,
              last_login_at, created_at, updated_at
       FROM students
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { students: rows as StudentRecord[], total };
  }

  async getStudentStats(): Promise<StudentStats> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & { total: number; active: number; inactive: number })[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
       FROM students`
    );

    const counts = rows[0] || { total: 0, active: 0, inactive: 0 };
    return {
      totalStudents: Number(counts.total) || 0,
      activeStudents: Number(counts.active) || 0,
      inactiveStudents: Number(counts.inactive) || 0,
    };
  }

  async updateStudentStatus(id: string, isActive: boolean): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE students SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [isActive ? 1 : 0, id]
    );
  }

  async resetStudentPassword(id: string, passwordHash: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE students SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [passwordHash, id]
    );
  }
}

export const studentsRepository = new StudentsRepository();
