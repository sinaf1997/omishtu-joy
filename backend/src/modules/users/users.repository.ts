import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  StaffRecord,
  StudentRecord,
  RoleRecord,
  CreateStaffData,
  StaffStats,
} from './users.types.js';

export interface ListStaffFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class UsersRepository {
  async isStaffActive(id: string): Promise<boolean> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & { is_active: number })[]>(
      `SELECT is_active FROM staff WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) {
      return true;
    }
    return Boolean(rows[0].is_active);
  }

  async isStudentActive(id: string): Promise<boolean> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & { is_active: number })[]>(
      `SELECT is_active FROM students WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) {
      return true;
    }
    return Boolean(rows[0].is_active);
  }

  async findStaffByEmail(email: string): Promise<StaffRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StaffRecord)[]>(
      `SELECT s.id, s.full_name, s.email, s.phone, s.password_hash, s.role_id,
              r.name AS role_name, r.display_name AS role_display_name,
              s.must_reset_password, s.is_active, s.last_login_at, s.deactivated_at,
              s.created_at, s.updated_at
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       WHERE LOWER(s.email) = ?
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as StaffRecord;
  }

  async findStaffById(id: string): Promise<StaffRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StaffRecord)[]>(
      `SELECT s.id, s.full_name, s.email, s.phone, s.password_hash, s.role_id,
              r.name AS role_name, r.display_name AS role_display_name,
              s.must_reset_password, s.is_active, s.last_login_at, s.deactivated_at,
              s.created_at, s.updated_at
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       WHERE s.id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as StaffRecord;
  }

  async findStudentByCode(studentCode: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT *
       FROM students
       WHERE UPPER(TRIM(student_code)) = ?
       LIMIT 1`,
      [studentCode.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as StudentRecord;
  }

  async findStudentById(id: string): Promise<StudentRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StudentRecord)[]>(
      `SELECT *
       FROM students
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as StudentRecord;
  }

  async findRoleByName(roleName: string): Promise<RoleRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & RoleRecord)[]>(
      `SELECT id, name, display_name, description FROM roles WHERE name = ? LIMIT 1`,
      [roleName]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as RoleRecord;
  }

  async findRoleById(roleId: string): Promise<RoleRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & RoleRecord)[]>(
      `SELECT id, name, display_name, description FROM roles WHERE id = ? LIMIT 1`,
      [roleId]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as RoleRecord;
  }

  async listRoles(): Promise<RoleRecord[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & RoleRecord & { user_count: number })[]>(
      `SELECT r.id, r.name, r.display_name, r.description,
              COUNT(s.id) AS user_count
       FROM roles r
       LEFT JOIN staff s ON s.role_id = r.id
       GROUP BY r.id, r.name, r.display_name, r.description
       ORDER BY r.name ASC`
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      description: r.description,
      user_count: Number(r.user_count) || 0,
      userCount: Number(r.user_count) || 0,
    }));
  }

  async countActiveOwners(): Promise<number> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       WHERE r.name = 'owner' AND s.is_active = 1`
    );
    return Number(rows[0]?.total) || 0;
  }

  async listStaff(): Promise<StaffRecord[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StaffRecord)[]>(
      `SELECT s.id, s.full_name, s.email, s.phone, s.password_hash, s.role_id,
              r.name AS role_name, r.display_name AS role_display_name,
              s.must_reset_password, s.is_active, s.last_login_at, s.deactivated_at,
              s.created_at, s.updated_at
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       ORDER BY s.created_at DESC`
    );
    return rows as StaffRecord[];
  }

  async listStaffPaginated(filters: ListStaffFilters): Promise<{ staff: StaffRecord[]; total: number }> {
    const pool = getDatabasePool();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.search && filters.search.trim().length > 0) {
      const term = `%${filters.search.toLowerCase().trim()}%`;
      conditions.push('(LOWER(s.full_name) LIKE ? OR LOWER(s.email) LIKE ? OR LOWER(s.phone) LIKE ?)');
      params.push(term, term, term);
    }

    if (filters.role && filters.role !== 'all') {
      conditions.push('r.name = ?');
      params.push(filters.role);
    }

    if (filters.status === 'active') {
      conditions.push('s.is_active = 1');
    } else if (filters.status === 'inactive') {
      conditions.push('s.is_active = 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total) || 0;

    // Apply pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<(RowDataPacket & StaffRecord)[]>(
      `SELECT s.id, s.full_name, s.email, s.phone, s.password_hash, s.role_id,
              r.name AS role_name, r.display_name AS role_display_name,
              s.must_reset_password, s.is_active, s.last_login_at, s.deactivated_at,
              s.created_at, s.updated_at
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      staff: rows as StaffRecord[],
      total,
    };
  }

  async createStaff(data: CreateStaffData): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `INSERT INTO staff (id, full_name, email, phone, password_hash, role_id, must_reset_password, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.fullName.trim(),
        data.email.toLowerCase().trim(),
        data.phone || null,
        data.passwordHash,
        data.roleId,
        data.mustResetPassword ? 1 : 0,
        1,
      ]
    );
  }

  async updateStaffProfile(
    id: string,
    updates: { fullName?: string; phone?: string | null; roleId?: string; isActive?: boolean }
  ): Promise<void> {
    const pool = getDatabasePool();
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (updates.fullName !== undefined) {
      setClauses.push('full_name = ?');
      params.push(updates.fullName.trim());
    }

    if (updates.phone !== undefined) {
      setClauses.push('phone = ?');
      params.push(updates.phone || null);
    }

    if (updates.roleId !== undefined) {
      setClauses.push('role_id = ?');
      params.push(updates.roleId);
    }

    if (updates.isActive !== undefined) {
      setClauses.push('is_active = ?');
      params.push(updates.isActive ? 1 : 0);
      setClauses.push('deactivated_at = ?');
      params.push(updates.isActive ? null : new Date());
    }

    if (setClauses.length === 0) return;

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await pool.query<ResultSetHeader>(
      `UPDATE staff SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );
  }

  async updateStaffRole(id: string, roleId: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE staff SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [roleId, id]
    );
  }

  async updateStaffStatus(id: string, isActive: boolean): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE staff
       SET is_active = ?,
           deactivated_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [isActive ? 1 : 0, isActive ? null : new Date(), id]
    );
  }

  async updateStaffPassword(id: string, passwordHash: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE staff
       SET password_hash = ?,
           must_reset_password = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, id]
    );
  }

  async updateStudentPassword(id: string, passwordHash: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE students
       SET password_hash = ?,
           must_reset_password = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, id]
    );
  }

  async updateStaffLastLogin(id: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE staff SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }

  async updateStudentLastLogin(id: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE students SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }

  async getStaffStats(): Promise<StaffStats> {
    const pool = getDatabasePool();
    const [staffRows] = await pool.query<(RowDataPacket & { total: number; active: number; inactive: number })[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
       FROM staff`
    );
    const [roleRows] = await pool.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM roles`
    );

    const staffCounts = staffRows[0] || { total: 0, active: 0, inactive: 0 };
    const roleCounts = roleRows[0] || { total: 0 };

    return {
      totalStaff: Number(staffCounts.total) || 0,
      activeStaff: Number(staffCounts.active) || 0,
      inactiveStaff: Number(staffCounts.inactive) || 0,
      rolesBreakdown: {
        owner: 0,
        manager: 0,
        academic_admin: 0,
        trainer: 0,
        accountant: 0,
        receptionist: 0,
      },
      totalRoles: Number(roleCounts.total) || 0,
    } as unknown as StaffStats;
  }

  async resetStaffPassword(id: string, passwordHash: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `UPDATE staff
       SET password_hash = ?,
           must_reset_password = 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, id]
    );
  }

  async getEmergencyContactsForStudent(studentId: string): Promise<RowDataPacket[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, full_name, contact_name, relationship, phone,
              alternate_phone, alt_phone, is_primary, created_at, updated_at
       FROM student_emergency_contacts
       WHERE student_id = ?
       ORDER BY is_primary DESC, created_at ASC`,
      [studentId]
    );
    return rows;
  }
}

export const usersRepository = new UsersRepository();
