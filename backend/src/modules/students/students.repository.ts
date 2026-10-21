import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  StudentRecord,
  EmergencyContactRecord,
  StudentStats,
} from './students.types.js';

export interface ListStudentFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateStudentTxData {
  id: string;
  studentCode?: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  passwordHash: string;
  registeredByStaffId: string | null;
  emergencyContacts: Array<{
    id: string;
    fullName: string;
    relationship: string;
    phone: string;
    alternatePhone: string | null;
    isPrimary: boolean;
  }>;
}

export class StudentsRepository {
  /**
   * Look up student by student_code (case-insensitive & trimmed)
   */
  async findStudentByCode(studentCode: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const cleanCode = studentCode.trim().toUpperCase();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT s.*, st.full_name AS registered_by_staff_name
       FROM students s
       LEFT JOIN staff st ON s.registered_by_staff_id = st.id
       WHERE UPPER(TRIM(s.student_code)) = ?
       LIMIT 1`,
      [cleanCode]
    );
    return rows.length > 0 ? (rows[0] as StudentRecord) : null;
  }

  /**
   * Look up student by ID
   */
  async findStudentById(id: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT s.*, st.full_name AS registered_by_staff_name
       FROM students s
       LEFT JOIN staff st ON s.registered_by_staff_id = st.id
       WHERE s.id = ?
       LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as StudentRecord) : null;
  }

  /**
   * Check if an active student exists with the same email
   */
  async findStudentByEmail(email: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT id, student_code, email FROM students WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
      [cleanEmail]
    );
    return rows.length > 0 ? (rows[0] as StudentRecord) : null;
  }

  /**
   * Check for soft duplicate (same phone & date of birth)
   */
  async findDuplicateByPhoneAndDob(phone: string, dob: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT id, student_code, first_name, last_name, phone, date_of_birth
       FROM students
       WHERE date_of_birth = ?
         AND (phone = ? OR REPLACE(REPLACE(phone, ' ', ''), '-', '') = ?)
       LIMIT 1`,
      [dob, phone.trim(), cleanPhone]
    );
    return rows.length > 0 ? (rows[0] as StudentRecord) : null;
  }

  /**
   * Atomic ID Generation within the database transaction:
   * Format: otc/NNNNN/YY (5 digits, zero-padded, reset each year)
   */
  async generateNextStudentId(connection: PoolConnection, yearCode: string): Promise<string> {
    await connection.query(
      `INSERT INTO student_id_counters (year_code, last_number)
       VALUES (?, LAST_INSERT_ID(1))
       ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)`,
      [yearCode]
    );

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT LAST_INSERT_ID() AS last_num`
    );

    const lastNum = Number(rows[0]?.last_num || 1);
    if (lastNum > 99999) {
      throw new Error(`Sequence limit of 99,999 students exceeded for year ${yearCode}`);
    }

    const paddedNum = String(lastNum).padStart(5, '0');
    return `otc/${paddedNum}/${yearCode}`;
  }

  /**
   * Atomic Transaction: generate ID + insert student + insert emergency contacts
   */
  async createStudentTransaction(data: CreateStudentTxData, yearCode: string): Promise<{ id: string; studentCode: string }> {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let studentCode = data.studentCode;
      if (!studentCode) {
        studentCode = await this.generateNextStudentId(connection, yearCode);
      }

      // Insert student record
      await connection.query<ResultSetHeader>(
        `INSERT INTO students (
           id, student_code, first_name, last_name, gender, date_of_birth,
           phone, email, address, city, password_hash, must_reset_password,
           is_active, registered_by_staff_id, registered_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, CURRENT_TIMESTAMP)`,
        [
          data.id,
          studentCode,
          data.firstName,
          data.lastName,
          data.gender,
          data.dateOfBirth,
          data.phone,
          data.email,
          data.address,
          data.city,
          data.passwordHash,
          data.registeredByStaffId,
        ]
      );

      // Insert emergency contacts
      for (const contact of data.emergencyContacts) {
        await connection.query<ResultSetHeader>(
          `INSERT INTO student_emergency_contacts (
             id, student_id, full_name, contact_name, relationship, phone,
             alternate_phone, alt_phone, is_primary
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            contact.id,
            data.id,
            contact.fullName,
            contact.fullName,
            contact.relationship,
            contact.phone,
            contact.alternatePhone,
            contact.alternatePhone,
            contact.isPrimary ? 1 : 0,
          ]
        );
      }

      await connection.commit();
      return { id: data.id, studentCode };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Legacy simple student creation method (preserves backward compatibility with unit tests)
   */
  async createStudent(data: { id: string; studentCode: string; passwordHash: string }): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `INSERT INTO students (
         id, student_code, password_hash, must_reset_password, is_active
       ) VALUES (?, ?, ?, 1, 1)`,
      [data.id, data.studentCode.trim().toUpperCase(), data.passwordHash]
    );
  }

  /**
   * Fetch emergency contacts for a student
   */
  async getEmergencyContacts(studentId: string): Promise<EmergencyContactRecord[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & EmergencyContactRecord)[]>(
      `SELECT id, student_id, full_name, relationship, phone, alternate_phone,
              is_primary, created_at, updated_at
       FROM student_emergency_contacts
       WHERE student_id = ?
       ORDER BY is_primary DESC, created_at ASC`,
      [studentId]
    );
    return rows as EmergencyContactRecord[];
  }

  /**
   * List paginated students with real search and filter
   */
  async listStudentsPaginated(filters: ListStudentFilters): Promise<{ students: StudentRecord[]; total: number }> {
    const pool = getDatabasePool();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.search) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        `(LOWER(s.student_code) LIKE ? OR LOWER(s.first_name) LIKE ? OR LOWER(s.last_name) LIKE ? OR LOWER(CONCAT(s.first_name, ' ', s.last_name)) LIKE ? OR s.phone LIKE ?)`
      );
      params.push(term, term, term, term, `%${filters.search.trim()}%`);
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push('s.is_active = ?');
      params.push(filters.status === 'active' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM students s ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT s.*, st.full_name AS registered_by_staff_name
       FROM students s
       LEFT JOIN staff st ON s.registered_by_staff_id = st.id
       ${whereClause}
       ORDER BY s.created_at DESC
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
      `UPDATE students SET password_hash = ?, must_reset_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [passwordHash, id]
    );
  }
}

export const studentsRepository = new StudentsRepository();
