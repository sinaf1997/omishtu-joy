import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { studentsRepository } from '../modules/students/students.repository.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';

describe('Students Module & RBAC Protection', () => {
  const app = createApp();
  let receptionistToken: string;
  let ownerToken: string;

  beforeEach(async () => {
    vi.restoreAllMocks();

    const receptionistHash = await hashPassword('password123');
    const receptionistStaff = {
      id: 'reception-staff-1',
      full_name: 'Receptionist Sarah',
      email: 'sarah@omishtu.com',
      password_hash: receptionistHash,
      role_id: 'role-receptionist',
      role_name: 'receptionist' as const,
      role_display_name: 'Receptionist',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ownerHash = await hashPassword('12345678');
    const ownerStaff = {
      id: 'owner-id-123',
      full_name: 'Owner Alexander',
      email: 'owner@gmail.com',
      password_hash: ownerHash,
      role_id: 'role-owner',
      role_name: 'owner' as const,
      role_display_name: 'Center Owner',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(usersRepository, 'findStaffByEmail').mockImplementation(async (email: string) => {
      if (email === 'sarah@omishtu.com') return receptionistStaff;
      if (email === 'owner@gmail.com') return ownerStaff;
      return null;
    });
    vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();

    // Login Receptionist
    const recLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'sarah@omishtu.com', password: 'password123' });
    receptionistToken = recLogin.body.data.token;

    // Login Owner
    const ownerLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'owner@gmail.com', password: '12345678' });
    ownerToken = ownerLogin.body.data.token;
  });

  describe('GET /api/students/stats', () => {
    it('returns student statistics', async () => {
      vi.spyOn(studentsRepository, 'getStudentStats').mockResolvedValue({
        totalStudents: 15,
        activeStudents: 12,
        inactiveStudents: 3,
      });

      const res = await request(app)
        .get('/api/students/stats')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        totalStudents: 15,
        activeStudents: 12,
        inactiveStudents: 3,
      });
    });
  });

  describe('GET /api/students', () => {
    it('returns paginated list of students', async () => {
      vi.spyOn(studentsRepository, 'listStudentsPaginated').mockResolvedValue({
        students: [
          {
            id: 'stud-1',
            student_code: 'OJ-2026-001',
            password_hash: 'hash',
            must_reset_password: 0,
            is_active: 1,
            last_login_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
      });

      const res = await request(app)
        .get('/api/students?page=1&limit=10')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].studentCode).toBe('OJ-2026-001');
      expect(res.body.data[0]).not.toHaveProperty('password_hash');
    });
  });

  describe('POST /api/students', () => {
    it('creates a new student account successfully', async () => {
      vi.spyOn(studentsRepository, 'findStudentByCode').mockResolvedValueOnce(null);
      vi.spyOn(studentsRepository, 'createStudent').mockResolvedValueOnce();
      vi.spyOn(studentsRepository, 'findStudentById').mockResolvedValueOnce({
        id: 'new-stud-id',
        student_code: 'OJ-2026-099',
        password_hash: 'hash',
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          studentCode: 'OJ-2026-099',
          password: 'SecureStudentPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentCode).toBe('OJ-2026-099');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('rejects duplicate studentCode with 409', async () => {
      vi.spyOn(studentsRepository, 'findStudentByCode').mockResolvedValueOnce({
        id: 'existing-id',
        student_code: 'OJ-2026-001',
        password_hash: 'hash',
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          studentCode: 'OJ-2026-001',
          password: 'SecureStudentPassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('STUDENT_EXISTS');
    });

    it('rejects student creation with password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          studentCode: 'OJ-2026-002',
          password: 'short',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/students/:id/status', () => {
    it('updates student active status', async () => {
      vi.spyOn(studentsRepository, 'findStudentById')
        .mockResolvedValueOnce({
          id: 'stud-1',
          student_code: 'OJ-2026-001',
          password_hash: 'hash',
          must_reset_password: 0,
          is_active: 1,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'stud-1',
          student_code: 'OJ-2026-001',
          password_hash: 'hash',
          must_reset_password: 0,
          is_active: 0,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      vi.spyOn(studentsRepository, 'updateStudentStatus').mockResolvedValueOnce();

      const res = await request(app)
        .patch('/api/students/stud-1/status')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });
  });
});
