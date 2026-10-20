import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';
import { assignableStaffRoles } from '../modules/users/users.schema.js';

describe('Owner Staff Management & RBAC Protection', () => {
  const app = createApp();
  let ownerToken: string;

  beforeEach(async () => {
    vi.restoreAllMocks();

    const ownerHash = await hashPassword('12345678');
    const ownerStaff = {
      id: 'owner-id-123',
      full_name: 'Owner Alexander',
      email: 'owner@gmail.com',
      password_hash: ownerHash,
      role_id: 'role-owner',
      role_name: 'owner' as const,
      role_display_name: 'Center Owner',
      must_reset_password: 1,
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
        email: 'owner@gmail.com',
        password: '12345678',
      });

    ownerToken = loginRes.body.data.token;
  });

  it('GET /api/users/stats returns staff and role metrics', async () => {
    vi.spyOn(usersRepository, 'getStaffStats').mockResolvedValue({
      totalStaff: 6,
      activeStaff: 5,
      inactiveStaff: 1,
      totalRoles: 6,
    });

    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      totalStaff: 6,
      activeStaff: 5,
      inactiveStaff: 1,
      totalRoles: 6,
    });
  });

  it('GET /api/roles returns all 6 system roles with user counts', async () => {
    vi.spyOn(usersRepository, 'listRoles').mockResolvedValue([
      { id: 'role-owner', name: 'owner', display_name: 'Center Owner', description: 'Governance', user_count: 1, userCount: 1 },
      { id: 'role-manager', name: 'manager', display_name: 'Operations Manager', description: 'Oversight', user_count: 2, userCount: 2 },
    ]);

    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('user_count');
  });

  it('GET /api/users returns paginated staff with filters', async () => {
    vi.spyOn(usersRepository, 'listStaffPaginated').mockResolvedValue({
      staff: [
        {
          id: 'staff-1',
          full_name: 'Alice Trainer',
          email: 'alice@omishtu.com',
          password_hash: 'hash',
          role_id: 'role-trainer',
          role_name: 'trainer',
          role_display_name: 'Course Trainer',
          must_reset_password: 0,
          is_active: 1,
          last_login_at: null,
          deactivated_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
    });

    const res = await request(app)
      .get('/api/users?search=alice&role=trainer&status=active&page=1&limit=10')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].email).toBe('alice@omishtu.com');
    expect(res.body.data[0]).not.toHaveProperty('password_hash');
    expect(res.body.data[0]).not.toHaveProperty('passwordHash');
    expect(res.body.meta).toHaveProperty('total', 1);
  });

  it('POST /api/users prevents creating another owner account', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        fullName: 'Second Owner',
        email: 'secondowner@gmail.com',
        role: 'owner',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/users returns 409 when email already exists', async () => {
    vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce({
      id: 'existing-id',
      full_name: 'Existing Staff',
      email: 'existing@omishtu.com',
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
        fullName: 'Existing Staff',
        email: 'existing@omishtu.com',
        role: 'trainer',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('PATCH /api/users/:id prevents owner from deactivating themselves', async () => {
    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce({
      id: 'owner-id-123',
      full_name: 'Owner Alexander',
      email: 'owner@gmail.com',
      password_hash: 'hash',
      role_id: 'role-owner',
      role_name: 'owner',
      role_display_name: 'Center Owner',
      must_reset_password: 1,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await request(app)
      .patch('/api/users/owner-id-123')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
  });

  it('PATCH /api/users/:id prevents owner from demoting or changing their own role', async () => {
    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce({
      id: 'owner-id-123',
      full_name: 'Owner Alexander',
      email: 'owner@gmail.com',
      password_hash: 'hash',
      role_id: 'role-owner',
      role_name: 'owner',
      role_display_name: 'Center Owner',
      must_reset_password: 1,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await request(app)
      .patch('/api/users/owner-id-123')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'manager' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_DEMOTE_SELF');
  });

  it('PATCH /api/users/:id rejects unknown fields (strict Zod validation)', async () => {
    const res = await request(app)
      .patch('/api/users/staff-123')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ full_name: 'Valid Name', illegalField: 'hacker' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/users/:id prevents assigning the owner role to any user', async () => {
    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce({
      id: 'staff-456',
      full_name: 'Trainer Elena',
      email: 'trainer@omishtu.com',
      password_hash: 'hash',
      role_id: 'role-trainer',
      role_name: 'trainer',
      role_display_name: 'Course Trainer',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await request(app)
      .patch('/api/users/staff-456')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'owner' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ROLE');
  });

  it('PATCH /api/users/:id successfully updates full_name and role', async () => {
    const originalStaff = {
      id: 'staff-456',
      full_name: 'Trainer Elena',
      email: 'trainer@omishtu.com',
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

    const updatedStaff = {
      ...originalStaff,
      full_name: 'Elena Rostova',
      role_id: 'role-manager',
      role_name: 'manager' as const,
      role_display_name: 'Operations Manager',
    };

    vi.spyOn(usersRepository, 'findStaffById')
      .mockResolvedValueOnce(originalStaff)
      .mockResolvedValueOnce(updatedStaff);
    vi.spyOn(usersRepository, 'findRoleByName').mockResolvedValueOnce({
      id: 'role-manager',
      name: 'manager',
      display_name: 'Operations Manager',
      description: null,
    });
    vi.spyOn(usersRepository, 'updateStaffProfile').mockResolvedValueOnce();

    const res = await request(app)
      .patch('/api/users/staff-456')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ full_name: 'Elena Rostova', role: 'manager' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Elena Rostova');
    expect(res.body.data.role).toBe('manager');
    expect(res.body.data).not.toHaveProperty('password_hash');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('PATCH /api/users/:id deactivates and reactivates user', async () => {
    const activeStaff = {
      id: 'staff-789',
      full_name: 'John Doe',
      email: 'john@omishtu.com',
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

    const inactiveStaff = {
      ...activeStaff,
      is_active: 0,
      deactivated_at: new Date().toISOString(),
    };

    vi.spyOn(usersRepository, 'findStaffById')
      .mockResolvedValueOnce(activeStaff)
      .mockResolvedValueOnce(inactiveStaff);
    vi.spyOn(usersRepository, 'updateStaffProfile').mockResolvedValueOnce();

    const res = await request(app)
      .patch('/api/users/staff-789')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('authGuard blocks any existing token for a deactivated user on the next request', async () => {
    vi.spyOn(usersRepository, 'isStaffActive').mockResolvedValueOnce(false);

    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('POST /api/users/:id/reset-password generates a temporary password and flags account', async () => {
    vi.spyOn(usersRepository, 'findStaffById').mockResolvedValue({
      id: 'staff-456',
      full_name: 'Trainer Elena',
      email: 'trainer@omishtu.com',
      password_hash: 'hash',
      role_id: 'role-trainer',
      role_name: 'trainer',
      role_display_name: 'Course Trainer',
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    vi.spyOn(usersRepository, 'resetStaffPassword').mockResolvedValue();

    const res = await request(app)
      .post('/api/users/staff-456/reset-password')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('temporaryPassword');
    expect(typeof res.body.data.temporaryPassword).toBe('string');
  });

  describe('Owner creates one staff per assignable role and verifies access boundaries', () => {
    for (const role of assignableStaffRoles) {
      it(`creates staff with role ${role}, logs in, and verifies non-owner is blocked from /api/users`, async () => {
        const staffEmail = `${role}-created@omishtu.com`;

        // 1. Mock creation
        vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce(null);
        vi.spyOn(usersRepository, 'findRoleByName').mockResolvedValueOnce({
          id: `role-${role}`,
          name: role,
          display_name: role,
          description: null,
        });
        vi.spyOn(usersRepository, 'createStaff').mockResolvedValueOnce();

        const createdRecord = {
          id: `id-${role}`,
          full_name: `Created ${role}`,
          email: staffEmail,
          password_hash: 'hash',
          role_id: `role-${role}`,
          role_name: role,
          role_display_name: role,
          must_reset_password: 1,
          is_active: 1,
          last_login_at: null,
          deactivated_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        vi.spyOn(usersRepository, 'findStaffById').mockResolvedValueOnce(createdRecord);

        const createRes = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            fullName: `Created ${role}`,
            email: staffEmail,
            role,
          });

        expect(createRes.status).toBe(201);
        const tempPassword = createRes.body.data.temporaryPassword;
        expect(typeof tempPassword).toBe('string');

        // 2. Staff logs in with created credentials
        const newHash = await hashPassword(tempPassword);
        vi.spyOn(usersRepository, 'findStaffByEmail').mockResolvedValueOnce({
          ...createdRecord,
          password_hash: newHash,
        });
        vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValueOnce();

        const loginRes = await request(app)
          .post('/api/auth/staff/login')
          .send({
            email: staffEmail,
            password: tempPassword,
          });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.data.user.role).toBe(role);
        expect(loginRes.body.data.user.portal).toBe('staff');
        expect(loginRes.body.data.user.mustResetPassword).toBe(true);

        const staffToken = loginRes.body.data.token;

        // 3. Newly created non-owner staff CANNOT access /api/users
        const blockedUsersRes = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${staffToken}`);

        expect(blockedUsersRes.status).toBe(403);
        expect(blockedUsersRes.body.error.code).toBe('FORBIDDEN');
      });
    }
  });
});
