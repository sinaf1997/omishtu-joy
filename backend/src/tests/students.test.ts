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
      phone: '+251 91 100 0001',
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
      phone: '+251 91 100 0002',
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
            student_code: 'otc/00001/26',
            first_name: 'Abebe',
            last_name: 'Bikila',
            phone: '+251911223344',
            password_hash: 'hash',
            must_reset_password: 1,
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
      expect(res.body.data[0].studentCode).toBe('otc/00001/26');
      expect(res.body.data[0]).not.toHaveProperty('password_hash');
      expect(res.body.data[0]).not.toHaveProperty('password');
    });
  });

  describe('GET /api/students/:id', () => {
    it('returns student details and emergency contacts', async () => {
      vi.spyOn(studentsRepository, 'findStudentById').mockResolvedValueOnce({
        id: 'stud-123',
        student_code: 'otc/00001/26',
        first_name: 'Abebe',
        last_name: 'Bikila',
        gender: 'male',
        date_of_birth: '2000-01-15',
        phone: '+251 91 122 3344',
        email: 'abebe@omishtu.com',
        address: 'Bole',
        city: 'Addis Ababa',
        registered_by_staff_id: 'reception-staff-1',
        registered_by_staff_name: 'Receptionist Sarah',
        registered_at: new Date().toISOString(),
        password_hash: 'hash',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(studentsRepository, 'getEmergencyContacts').mockResolvedValueOnce([
        {
          id: 'ec-1',
          student_id: 'stud-123',
          full_name: 'Almaz Kebede',
          relationship: 'Mother',
          phone: '+251 92 111 2233',
          alternate_phone: null,
          is_primary: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const res = await request(app)
        .get('/api/students/stud-123')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentCode).toBe('otc/00001/26');
      expect(res.body.data.firstName).toBe('Abebe');
      expect(res.body.data.lastName).toBe('Bikila');
      expect(res.body.data.emergencyContacts.length).toBe(1);
      expect(res.body.data.emergencyContacts[0].fullName).toBe('Almaz Kebede');
      expect(res.body.data.emergencyContacts[0].isPrimary).toBe(true);
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('returns 404 when student not found', async () => {
      vi.spyOn(studentsRepository, 'findStudentById').mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/students/non-existent-id')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('STUDENT_NOT_FOUND');
    });
  });

  describe('POST /api/students (Sprint 2 Full In-Person Registration)', () => {
    it('creates a new student with otc/NNNNN/YY ID and emergency contacts inside transaction', async () => {
      vi.spyOn(studentsRepository, 'findStudentByEmail').mockResolvedValueOnce(null);
      vi.spyOn(studentsRepository, 'findDuplicateByPhoneAndDob').mockResolvedValueOnce(null);
      vi.spyOn(studentsRepository, 'createStudentTransaction').mockResolvedValueOnce({
        id: 'new-uuid',
        studentCode: 'otc/00001/26',
      });
      vi.spyOn(studentsRepository, 'findStudentById').mockResolvedValueOnce({
        id: 'new-uuid',
        student_code: 'otc/00001/26',
        first_name: 'Tirunesh',
        last_name: 'Dibaba',
        gender: 'female',
        date_of_birth: '1998-05-10',
        phone: '+251 91 123 4567',
        email: 'tirunesh@omishtu.com',
        address: 'Arada',
        city: 'Addis Ababa',
        registered_by_staff_id: 'reception-staff-1',
        registered_at: new Date().toISOString(),
        password_hash: 'hashedPassword',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(studentsRepository, 'getEmergencyContacts').mockResolvedValueOnce([
        {
          id: 'ec-new',
          student_id: 'new-uuid',
          full_name: 'Bekele Dibaba',
          relationship: 'Father',
          phone: '+251 92 222 3344',
          alternate_phone: null,
          is_primary: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Tirunesh',
          lastName: 'Dibaba',
          gender: 'female',
          dateOfBirth: '1998-05-10',
          phone: '+251 91 123 4567',
          email: 'tirunesh@omishtu.com',
          address: 'Arada',
          city: 'Addis Ababa',
          password: 'StudentSecurePass123!',
          confirmPassword: 'StudentSecurePass123!',
          emergencyContacts: [
            {
              fullName: 'Bekele Dibaba',
              relationship: 'Father',
              phone: '+251 92 222 3344',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentCode).toBe('otc/00001/26');
      expect(res.body.data.mustResetPassword).toBe(true);
      expect(res.body.data.emergencyContacts.length).toBe(1);
      expect(res.body.data.emergencyContacts[0].isPrimary).toBe(true);
      // Ensure password and password_hash are NEVER returned
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('rejects duplicate email with 409 EMAIL_IN_USE', async () => {
      vi.spyOn(studentsRepository, 'findStudentByEmail').mockResolvedValueOnce({
        id: 'existing-stud',
        student_code: 'otc/00001/26',
        email: 'taken@omishtu.com',
        password_hash: 'hash',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Duplicate',
          lastName: 'Tester',
          gender: 'male',
          dateOfBirth: '2000-01-01',
          phone: '+251 91 123 4567',
          email: 'taken@omishtu.com',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
          emergencyContacts: [
            {
              fullName: 'Contact Person',
              relationship: 'Sibling',
              phone: '+251 91 999 8888',
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_IN_USE');
    });

    it('triggers soft duplicate warning for matching phone and DOB unless allowed', async () => {
      vi.spyOn(studentsRepository, 'findStudentByEmail').mockResolvedValueOnce(null);
      vi.spyOn(studentsRepository, 'findDuplicateByPhoneAndDob').mockResolvedValueOnce({
        id: 'existing-dup',
        student_code: 'otc/00005/26',
        password_hash: 'hash',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 1. Without allowDuplicateWarning -> soft duplicate warning returned
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Sibling',
          lastName: 'Tester',
          gender: 'male',
          dateOfBirth: '2000-01-01',
          phone: '+251 91 123 4567',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
          emergencyContacts: [
            {
              fullName: 'Contact Person',
              relationship: 'Parent',
              phone: '+251 91 999 8888',
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_STUDENT_WARNING');

      // 2. With allowDuplicateWarning: true -> proceeds with registration
      vi.spyOn(studentsRepository, 'findStudentByEmail').mockResolvedValueOnce(null);
      vi.spyOn(studentsRepository, 'createStudentTransaction').mockResolvedValueOnce({
        id: 'new-allowed-dup',
        studentCode: 'otc/00006/26',
      });
      vi.spyOn(studentsRepository, 'findStudentById').mockResolvedValueOnce({
        id: 'new-allowed-dup',
        student_code: 'otc/00006/26',
        first_name: 'Sibling',
        last_name: 'Tester',
        password_hash: 'hash',
        must_reset_password: 1,
        is_active: 1,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.spyOn(studentsRepository, 'getEmergencyContacts').mockResolvedValueOnce([]);

      const allowedRes = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Sibling',
          lastName: 'Tester',
          gender: 'male',
          dateOfBirth: '2000-01-01',
          phone: '+251 91 123 4567',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
          allowDuplicateWarning: true,
          emergencyContacts: [
            {
              fullName: 'Contact Person',
              relationship: 'Parent',
              phone: '+251 91 999 8888',
            },
          ],
        });

      expect(allowedRes.status).toBe(201);
      expect(allowedRes.body.data.studentCode).toBe('otc/00006/26');
    });

    it('rejects student creation with password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'Short',
          lastName: 'Pass',
          gender: 'male',
          dateOfBirth: '2000-01-01',
          phone: '+251 91 123 4567',
          password: 'short',
        });

      expect(res.status).toBe(400);
    });

    it('rejects student creation without emergency contact', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          firstName: 'No',
          lastName: 'Contact',
          gender: 'male',
          dateOfBirth: '2000-01-01',
          phone: '+251 91 123 4567',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
          emergencyContacts: [],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/students/:id/status', () => {
    it('updates student active status', async () => {
      vi.spyOn(studentsRepository, 'findStudentById')
        .mockResolvedValueOnce({
          id: 'stud-1',
          student_code: 'otc/00001/26',
          password_hash: 'hash',
          must_reset_password: 0,
          is_active: 1,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'stud-1',
          student_code: 'otc/00001/26',
          password_hash: 'hash',
          must_reset_password: 0,
          is_active: 0,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      vi.spyOn(studentsRepository, 'updateStudentStatus').mockResolvedValueOnce();
      vi.spyOn(studentsRepository, 'getEmergencyContacts').mockResolvedValueOnce([]);

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
