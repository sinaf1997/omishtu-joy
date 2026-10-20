import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';
import { assignableStaffRoles } from '../modules/users/users.schema.js';

describe('Owner Flow Verification & Access Control', () => {
  const app = createApp();
  let ownerToken: string;

  const mockOwner = {
    id: 'owner-id-real',
    full_name: 'Center Owner Alexander',
    email: 'owner@gmail.com',
    password_hash: '',
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

  beforeEach(async () => {
    vi.restoreAllMocks();

    mockOwner.password_hash = await hashPassword('OwnerPass123!');

    vi.spyOn(usersRepository, 'findStaffByEmail').mockImplementation(async (email: string) => {
      if (email.toLowerCase() === 'owner@gmail.com') return mockOwner;
      return null;
    });
    vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();

    const loginRes = await request(app)
      .post('/api/auth/staff/login')
      .send({
        email: 'owner@gmail.com',
        password: 'OwnerPass123!',
      });

    expect(loginRes.status).toBe(200);
    ownerToken = loginRes.body.data.token;
  });

  it('1. Owner adds a user for each of the 5 roles', async () => {
    for (const role of assignableStaffRoles) {
      const email = `${role}.user@gmail.com`;

      vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce(null);
      vi.spyOn(usersRepository, 'findRoleByName').mockResolvedValueOnce({
        id: `role-${role}-id`,
        name: role,
        display_name: role,
        description: null,
      });
      vi.spyOn(usersRepository, 'createStaff').mockResolvedValueOnce();
      vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce({
        id: `user-${role}-id`,
        full_name: `Test ${role}`,
        email,
        password_hash: 'hash',
        role_id: `role-${role}-id`,
        role_name: role,
        role_display_name: role,
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        deactivated_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fullName: `Test ${role}`,
          email,
          role,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.staff.role).toBe(role);
      expect(res.body.data.staff.mustResetPassword).toBe(true);
      expect(res.body.data).toHaveProperty('temporaryPassword');
      expect(typeof res.body.data.temporaryPassword).toBe('string');
      expect(res.body.data.staff).not.toHaveProperty('passwordHash');
      expect(res.body.data.staff).not.toHaveProperty('password_hash');
    }
  });

  it('2. Owner edits a user role and full name via PATCH /api/users/:id', async () => {
    const existing = {
      id: 'staff-edit-1',
      full_name: 'Original Name',
      email: 'original@gmail.com',
      password_hash: 'hash',
      role_id: 'role-trainer',
      role_name: 'trainer' as const,
      role_display_name: 'Course Trainer',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = {
      ...existing,
      full_name: 'Updated Name',
      role_id: 'role-manager',
      role_name: 'manager' as const,
      role_display_name: 'Operations Manager',
    };

    vi.spyOn(usersRepository, 'findStaffById')
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    vi.spyOn(usersRepository, 'findRoleByName').mockResolvedValueOnce({
      id: 'role-manager',
      name: 'manager',
      display_name: 'Operations Manager',
      description: null,
    });
    vi.spyOn(usersRepository, 'updateStaffProfile').mockResolvedValueOnce();

    const res = await request(app)
      .patch('/api/users/staff-edit-1')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        full_name: 'Updated Name',
        role: 'manager',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Updated Name');
    expect(res.body.data.role).toBe('manager');
  });

  it('3. Owner deactivates and reactivates a user', async () => {
    const activeStaff = {
      id: 'staff-status-1',
      full_name: 'Status Test',
      email: 'status@gmail.com',
      password_hash: 'hash',
      role_id: 'role-receptionist',
      role_name: 'receptionist' as const,
      role_display_name: 'Front Desk',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const deactivatedStaff = {
      ...activeStaff,
      is_active: 0,
      deactivated_at: new Date().toISOString(),
    };

    // Deactivate
    vi.spyOn(usersRepository, 'findStaffById')
      .mockResolvedValueOnce(activeStaff)
      .mockResolvedValueOnce(deactivatedStaff);
    vi.spyOn(usersRepository, 'updateStaffProfile').mockResolvedValueOnce();

    const deactRes = await request(app)
      .patch('/api/users/staff-status-1')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ is_active: false });

    expect(deactRes.status).toBe(200);
    expect(deactRes.body.data.isActive).toBe(false);

    // Reactivate
    vi.spyOn(usersRepository, 'findStaffById')
      .mockResolvedValueOnce(deactivatedStaff)
      .mockResolvedValueOnce(activeStaff);
    vi.spyOn(usersRepository, 'updateStaffProfile').mockResolvedValueOnce();

    const reactRes = await request(app)
      .patch('/api/users/staff-status-1')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ is_active: true });

    expect(reactRes.status).toBe(200);
    expect(reactRes.body.data.isActive).toBe(true);
  });

  it('4. Owner resets a user password and sets must_reset_password = true', async () => {
    const userToReset = {
      id: 'staff-reset-target',
      full_name: 'Target User',
      email: 'target@gmail.com',
      password_hash: 'old_hash',
      role_id: 'role-trainer',
      role_name: 'trainer' as const,
      role_display_name: 'Course Trainer',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValue({
      ...userToReset,
      must_reset_password: 1,
    });
    vi.spyOn(usersRepository, 'resetStaffPassword').mockResolvedValue();

    const res = await request(app)
      .post('/api/users/staff-reset-target/reset-password')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.staff.mustResetPassword).toBe(true);
    expect(res.body.data).toHaveProperty('temporaryPassword');
  });

  it('5. Duplicate email returns 409', async () => {
    vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce({
      id: 'existing-staff',
      full_name: 'Existing',
      email: 'duplicate@gmail.com',
      password_hash: 'hash',
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

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        fullName: 'New Person',
        email: 'duplicate@gmail.com',
        role: 'trainer',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('6. Blocked cases: owner deactivating self returns 400', async () => {
    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce(mockOwner);

    const res = await request(app)
      .patch('/api/users/owner-id-real')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ is_active: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
  });

  it('7. Blocked cases: assigning owner role returns 400', async () => {
    // Add user
    const addRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        fullName: 'New Owner Attempt',
        email: 'newowner@gmail.com',
        role: 'owner',
      });
    expect(addRes.status).toBe(400);

    // Edit user
    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce({
      id: 'staff-edit-owner',
      full_name: 'Staff Member',
      email: 'staff@gmail.com',
      password_hash: 'hash',
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

    const editRes = await request(app)
      .patch('/api/users/staff-edit-owner')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'owner' });

    expect(editRes.status).toBe(400);
  });

  it('8. Blocked cases: non-owner calling /api/users returns 403', async () => {
    const trainerHash = await hashPassword('Trainer123!');
    const trainerUser = {
      id: 'trainer-test-id',
      full_name: 'Trainer Dave',
      email: 'trainer.dave@gmail.com',
      password_hash: trainerHash,
      role_id: 'role-trainer',
      role_name: 'trainer' as const,
      role_display_name: 'Trainer',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce(trainerUser);

    const loginRes = await request(app)
      .post('/api/auth/staff/login')
      .send({
        email: 'trainer.dave@gmail.com',
        password: 'Trainer123!',
      });

    const trainerToken = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${trainerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('9. Blocked cases: deactivated user logging in is rejected (403)', async () => {
    const deactivatedUser = {
      id: 'deactivated-id',
      full_name: 'Deactivated User',
      email: 'deactivated@gmail.com',
      password_hash: await hashPassword('SomePass123!'),
      role_id: 'role-trainer',
      role_name: 'trainer' as const,
      role_display_name: 'Trainer',
      must_reset_password: 0,
      is_active: 0,
      last_login_at: null,
      deactivated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce(deactivatedUser);

    const res = await request(app)
      .post('/api/auth/staff/login')
      .send({
        email: 'deactivated@gmail.com',
        password: 'SomePass123!',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('10. Blocked cases: existing token for deactivated user fails in authGuard (403)', async () => {
    vi.spyOn(usersRepository, 'isStaffActive').mockResolvedValueOnce(false);

    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});
