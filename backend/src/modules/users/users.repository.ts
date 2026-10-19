import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDatabasePool } from '../../config/database.js';
import {
  StaffRecord,
  StudentRecord,
  RoleRecord,
  CreateStaffData,
} from './users.types.js';

export class UsersRepository {
  async findStaffByEmail(email: string): Promise<StaffRecord | null> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StaffRecord)[]>(
      `SELECT s.id, s.full_name, s.email, s.password_hash, s.role_id,
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
      `SELECT s.id, s.full_name, s.email, s.password_hash, s.role_id,
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
      `SELECT id, student_code, password_hash, must_reset_password, is_active,
              last_login_at, created_at, updated_at
       FROM students
       WHERE UPPER(student_code) = ?
       LIMIT 1`,
      [studentCode.toUpperCase().trim()]
    );

    if (rows.length === 0) {
      return null;
    }
    return rows[0] as StudentRecord;
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
    const [rows] = await pool.query<(RowDataPacket & RoleRecord)[]>(
      `SELECT id, name, display_name, description FROM roles ORDER BY name ASC`
    );
    return rows as RoleRecord[];
  }

  async listStaff(): Promise<StaffRecord[]> {
    const pool = getDatabasePool();
    const [rows] = await pool.query<(RowDataPacket & StaffRecord)[]>(
      `SELECT s.id, s.full_name, s.email, s.password_hash, s.role_id,
              r.name AS role_name, r.display_name AS role_display_name,
              s.must_reset_password, s.is_active, s.last_login_at, s.deactivated_at,
              s.created_at, s.updated_at
       FROM staff s
       INNER JOIN roles r ON s.role_id = r.id
       ORDER BY s.created_at DESC`
    );
    return rows as StaffRecord[];
  }

  async createStaff(data: CreateStaffData): Promise<void> {
    const pool = getDatabasePool();
    await pool.query<ResultSetHeader>(
      `INSERT INTO staff (id, full_name, email, password_hash, role_id, must_reset_password, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.fullName.trim(),
        data.email.toLowerCase().trim(),
        data.passwordHash,
        data.roleId,
        data.mustResetPassword ? 1 : 0,
        data.isActive ? 1 : 0,
      ]
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
}

export const usersRepository = new UsersRepository();
