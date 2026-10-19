import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';
import { StaffRole } from '../types/index.js';

describe('Auth & RBAC Integration Flows', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Staff Login by Each Role', () => {
    const staffRoles: StaffRole[] = [
      'owner',
      'receptionist',
      'academic_admin',
      'trainer',
      'accountant',
      'manager',
    ];

    staffRoles.forEach((role) => {
      it(`logs in staff member with role: ${role}`, async () => {
        const hashedPassword = await hashPassword('ValidPassword123!');
        const mockStaffRecord = {
          id: `staff-${role}-1`,
          full_name: `${role} Test User`,
          email: `${role}@omishtu.com`,
          password_hash: hashedPassword,
          role_id: `role-${role}`,
          role_name: role,
          role_display_name: `${role} Display`,
          must_reset_password: 0,
          is_active: 1,
          last_login_at: null,
          deactivated_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue(mockStaffRecord);
        vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();

        const response = await request(app)
          .post('/api/auth/staff/login')
          .send({
            email: `${role}@omishtu.com`,
            password: 'ValidPassword123!',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.user.role).toBe(role);
        expect(response.body.data.user.portal).toBe('staff');
        expect(response.body.data.user.mustResetPassword).toBe(false);
      });
    });

    it('rejects staff login with wrong password using generic error', async () => {
      const hashedPassword = await hashPassword('ValidPassword123!');
      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue({
        id: 'staff-1',
        full_name: 'Test Staff',
        email: 'staff@omishtu.com',
        password_hash: hashedPassword,
        role_id: 'role-owner',
        role_name: 'owner',
        role_display_name: 'Owner',
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        deactivated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'staff@omishtu.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('rejects staff login with non-existent email using same generic error', async () => {
      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'nonexistent@omishtu.com',
          password: 'AnyPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('blocks inactive staff accounts from logging in', async () => {
      const hashedPassword = await hashPassword('ValidPassword123!');
      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue({
        id: 'staff-inactive',
        full_name: 'Deactivated User',
        email: 'inactive@omishtu.com',
        password_hash: hashedPassword,
        role_id: 'role-trainer',
        role_name: 'trainer',
        role_display_name: 'Trainer',
        must_reset_password: 0,
        is_active: 0,
        last_login_at: null,
        deactivated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'inactive@omishtu.com',
          password: 'ValidPassword123!',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('2. Student Login Flow', () => {
    it('successfully logs in student with valid credentials', async () => {
      const hashedPassword = await hashPassword('StudentPass123!');
      vi.spyOn(usersRepository, 'findStudentByCode').mockResolvedValue({
        id: 'student-1',
        student_code: 'STD-2026-001',
        password_hash: hashedPassword,
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(usersRepository, 'updateStudentLastLogin').mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/student/login')
        .send({
          studentCode: 'STD-2026-001',
          password: 'StudentPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.portal).toBe('student');
      expect(response.body.data.user.role).toBe('student');
      expect(response.body.data.user.studentCode).toBe('STD-2026-001');
    });

    it('rejects student login with wrong password using generic error', async () => {
      const hashedPassword = await hashPassword('StudentPass123!');
      vi.spyOn(usersRepository, 'findStudentByCode').mockResolvedValue({
        id: 'student-1',
        student_code: 'STD-2026-001',
        password_hash: hashedPassword,
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/student/login')
        .send({
          studentCode: 'STD-2026-001',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid Student ID or password');
    });

    it('rejects student login for inactive student accounts', async () => {
      const hashedPassword = await hashPassword('StudentPass123!');
      vi.spyOn(usersRepository, 'findStudentByCode').mockResolvedValue({
        id: 'student-inactive',
        student_code: 'STD-INACTIVE',
        password_hash: hashedPassword,
        must_reset_password: 0,
        is_active: 0,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/student/login')
        .send({
          studentCode: 'STD-INACTIVE',
          password: 'StudentPass123!',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('3. Forced Password Change Flow', () => {
    it('allows changing password and marks must_reset_password = false', async () => {
      const oldHash = await hashPassword('OldPassword123!');
      const mockStaff = {
        id: 'staff-reset-1',
        full_name: 'Needs Reset',
        email: 'reset@omishtu.com',
        password_hash: oldHash,
        role_id: 'role-trainer',
        role_name: 'trainer' as StaffRole,
        role_display_name: 'Trainer',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        deactivated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue(mockStaff);
      vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();

      // First log in to get token with mustResetPassword = true
      const loginRes = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'reset@omishtu.com',
          password: 'OldPassword123!',
        });

      const token = loginRes.body.data.token;
      expect(loginRes.body.data.user.mustResetPassword).toBe(true);

      vi.spyOn(usersRepository, 'findStaffById').mockResolvedValue(mockStaff);
      vi.spyOn(usersRepository, 'updateStaffPassword').mockResolvedValue();

      // Call change password
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword123!',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);
      expect(changeRes.body.data.user.mustResetPassword).toBe(false);
      expect(changeRes.body.data).toHaveProperty('token');
    });
  });

  describe('4. Owner Staff Management & Portal Isolation', () => {
    it('allows Owner to create new staff member, returns temp password once with must_reset_password = true', async () => {
      const ownerHash = await hashPassword('OwnerPass123!');
      const ownerStaff = {
        id: 'owner-id',
        full_name: 'Center Owner',
        email: 'owner@omishtu.com',
        password_hash: ownerHash,
        role_id: 'role-owner',
        role_name: 'owner' as StaffRole,
        role_display_name: 'Center Owner',
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        deactivated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue(ownerStaff);
      vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();

      const loginRes = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'owner@omishtu.com',
          password: 'OwnerPass123!',
        });

      const ownerToken = loginRes.body.data.token;

      // Mock creation queries
      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce(null); // No collision
      vi.spyOn(usersRepository, 'findRoleByName').mockResolvedValue({
        id: 'role-trainer',
        name: 'trainer',
        display_name: 'Course Trainer',
        description: null,
      });
      vi.spyOn(usersRepository, 'createStaff').mockResolvedValue();
      vi.spyOn(usersRepository, 'findStaffById').mockResolvedValue({
        id: 'new-trainer-id',
        full_name: 'New Trainer',
        email: 'newtrainer@omishtu.com',
        password_hash: 'hashed',
        role_id: 'role-trainer',
        role_name: 'trainer',
        role_display_name: 'Course Trainer',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        deactivated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fullName: 'New Trainer',
          email: 'newtrainer@omishtu.com',
          role: 'trainer',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data).toHaveProperty('temporaryPassword');
      expect(createRes.body.data.staff.mustResetPassword).toBe(true);
      expect(createRes.body.data.staff.email).toBe('newtrainer@omishtu.com');
      expect(createRes.body.data.staff).not.toHaveProperty('passwordHash');
      expect(createRes.body.data.staff).not.toHaveProperty('password_hash');
    });

    it('blocks non-owner staff from accessing /api/users', async () => {
      const trainerHash = await hashPassword('TrainerPass123!');
      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValue({
        id: 'trainer-id',
        full_name: 'Trainer User',
        email: 'trainer@omishtu.com',
        password_hash: trainerHash,
        role_id: 'role-trainer',
        role_name: 'trainer',
        role_display_name: 'Trainer',
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        deactivated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();

      const loginRes = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'trainer@omishtu.com',
          password: 'TrainerPass123!',
        });

      const trainerToken = loginRes.body.data.token;

      const forbiddenRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(forbiddenRes.status).toBe(403);
      expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks student token from accessing staff /api/users (wrong portal check)', async () => {
      const studentHash = await hashPassword('StudentPass123!');
      vi.spyOn(usersRepository, 'findStudentByCode').mockResolvedValue({
        id: 'student-id',
        student_code: 'STD-PORTAL-TEST',
        password_hash: studentHash,
        must_reset_password: 0,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(usersRepository, 'updateStudentLastLogin').mockResolvedValue();

      const loginRes = await request(app)
        .post('/api/auth/student/login')
        .send({
          studentCode: 'STD-PORTAL-TEST',
          password: 'StudentPass123!',
        });

      const studentToken = loginRes.body.data.token;

      const wrongPortalRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(wrongPortalRes.status).toBe(403);
      expect(wrongPortalRes.body.error.code).toBe('WRONG_PORTAL');
    });
  });
});
