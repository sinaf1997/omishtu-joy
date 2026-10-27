import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';

describe('Courses Module, Timetables & RBAC Integration Tests', () => {
  const app = createApp();

  let academicAdminToken: string;
  let receptionistToken: string;
  let trainerToken: string;
  let studentToken: string;
  let majorCourseId: string;
  let electiveCourseId1: string;

  beforeAll(async () => {
    // Clean up courses test data before running
    const pool = getDatabasePool();
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM course_schedule_slots');
    await pool.query('DELETE FROM courses');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    // Clean up courses test data after running
    const pool = getDatabasePool();
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM course_schedule_slots');
    await pool.query('DELETE FROM courses');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    await closeDatabasePool();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();

    const hashedPassword = await hashPassword('ValidPass123!');

    const createStaff = (role: string, id: string, name: string) => ({
      id,
      full_name: name,
      email: `${role}@omishtu.com`,
      phone: '+251 91 100 0001',
      password_hash: hashedPassword,
      role_id: `role-${role}`,
      role_name: role as any,
      role_display_name: `${role} Display`,
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      deactivated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const academicStaff = createStaff('academic_admin', 'staff-academics-001', 'Prof. Marcus Vance (Academic Admin)');
    const receptionStaff = createStaff('receptionist', 'staff-receptionist-001', 'Sara Kebede (Receptionist)');
    const trainerStaff = createStaff('trainer', 'staff-trainer-001', 'Elena Rostova (Trainer)');

    vi.spyOn(usersRepository, 'findStaffByEmail').mockImplementation(async (email: string) => {
      if (email === 'academic_admin@omishtu.com') return academicStaff;
      if (email === 'receptionist@omishtu.com') return receptionStaff;
      if (email === 'trainer@omishtu.com') return trainerStaff;
      return null;
    });
    vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();
    vi.spyOn(usersRepository, 'isStaffActive').mockResolvedValue(true);
    vi.spyOn(usersRepository, 'isStudentActive').mockResolvedValue(true);

    // Login Academic Admin
    const adminLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'academic_admin@omishtu.com', password: 'ValidPass123!' });
    academicAdminToken = adminLogin.body.data.token;

    // Login Receptionist
    const recLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'receptionist@omishtu.com', password: 'ValidPass123!' });
    receptionistToken = recLogin.body.data.token;

    // Login Trainer
    const trLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'trainer@omishtu.com', password: 'ValidPass123!' });
    trainerToken = trLogin.body.data.token;

    // Login Student
    const mockStudent = {
      id: 'student-seed-001',
      student_code: 'STD-2026-001',
      password_hash: hashedPassword,
      must_reset_password: 0,
      is_active: 1,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.spyOn(usersRepository, 'findStudentByCode').mockResolvedValue(mockStudent);
    vi.spyOn(usersRepository, 'updateStudentLastLogin').mockResolvedValue();

    const studentLogin = await request(app)
      .post('/api/auth/student/login')
      .send({ studentCode: 'STD-2026-001', password: 'ValidPass123!' });
    studentToken = studentLogin.body.data.token;
  });

  describe('1. Course Creation & Timetable Management', () => {
    it('academic_admin creates one MAJOR and two ELECTIVE courses with timetables', async () => {
      // 1. Create MAJOR course
      const majorRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'cs-101',
          title: 'Full-Stack Software Engineering',
          description: 'Core comprehensive software development curriculum',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2027-02-01',
          capacity: 35,
          location: 'Lab A',
          slots: [
            { day_of_week: 1, start_time: '09:00', end_time: '11:00', room: 'Lab A' },
            { day_of_week: 3, start_time: '09:00', end_time: '11:00', room: 'Lab A' },
          ],
        });

      expect(majorRes.status).toBe(201);
      expect(majorRes.body.data.code).toBe('CS-101');
      expect(majorRes.body.data.course_type).toBe('major');
      expect(majorRes.body.data.status).toBe('draft');
      expect(majorRes.body.data.capacity).toBe(35);
      expect(majorRes.body.data.slots).toHaveLength(2);
      expect(majorRes.body.data.slot_summary).toContain('09:00-11:00');
      majorCourseId = majorRes.body.data.id;

      // 2. Create ELECTIVE 1
      const el1Res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'el-201',
          title: 'UI/UX Design Masterclass',
          description: 'Figma and product design fundamentals',
          course_type: 'elective',
          start_date: '2026-11-01',
          end_date: '2027-01-15',
          capacity: 20,
          location: 'Room 102',
          slots: [
            { day_of_week: 2, start_time: '14:00', end_time: '16:00', room: 'Room 102' },
          ],
        });

      expect(el1Res.status).toBe(201);
      expect(el1Res.body.data.code).toBe('EL-201');
      expect(el1Res.body.data.course_type).toBe('elective');
      electiveCourseId1 = el1Res.body.data.id;

      // 3. Create ELECTIVE 2
      const el2Res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'el-202',
          title: 'Digital Marketing & SEO',
          description: 'Marketing strategies for modern startups',
          course_type: 'elective',
          start_date: '2026-11-01',
          end_date: '2027-01-15',
          capacity: 25,
          location: 'Room 103',
          slots: [
            { day_of_week: 4, start_time: '14:00', end_time: '16:00', room: 'Room 103' },
          ],
        });

      expect(el2Res.status).toBe(201);
      expect(el2Res.body.data.code).toBe('EL-202');
      expect(el2Res.body.data.course_type).toBe('elective');

      // Verify list endpoint contains all 3 with correct type
      const listRes = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.courses).toHaveLength(3);
    });

    it('rejects duplicate course code with 409 CONFLICT', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'cs-101', // already used
          title: 'Duplicate Computer Science',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2027-02-01',
          capacity: 30,
          slots: [{ day_of_week: 5, start_time: '09:00', end_time: '11:00' }],
        });

      expect(res.status).toBe(409);
      const errMsg = res.body.error?.message || res.body.message;
      expect(errMsg).toContain('already exists');
    });

    it('validates constraints: capacity 0, capacity 501, end date before start date, slot < 30m, internal overlap', async () => {
      // Capacity 0
      const cap0 = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'BAD-001',
          title: 'Bad Capacity Zero',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2026-12-01',
          capacity: 0,
          slots: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
        });
      expect(cap0.status).toBe(400);

      // Capacity 501
      const cap501 = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'BAD-002',
          title: 'Bad Capacity 501',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2026-12-01',
          capacity: 501,
          slots: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
        });
      expect(cap501.status).toBe(400);

      // End date before start date
      const badDates = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'BAD-003',
          title: 'Bad Date Range',
          course_type: 'major',
          start_date: '2026-12-01',
          end_date: '2026-11-01',
          capacity: 25,
          slots: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
        });
      expect(badDates.status).toBe(400);

      // Slot shorter than 30 minutes (20 mins)
      const shortSlot = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'BAD-004',
          title: 'Bad Short Slot',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2026-12-01',
          capacity: 25,
          slots: [{ day_of_week: 1, start_time: '09:00', end_time: '09:20' }],
        });
      expect(shortSlot.status).toBe(400);

      // Overlapping slots inside same course on Monday
      const internalOverlap = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'BAD-005',
          title: 'Internal Slot Overlap',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2026-12-01',
          capacity: 25,
          slots: [
            { day_of_week: 1, start_time: '09:00', end_time: '11:00' },
            { day_of_week: 1, start_time: '10:30', end_time: '12:00' },
          ],
        });
      expect(internalOverlap.status).toBe(400);
      const errMsg = internalOverlap.body.error?.message || internalOverlap.body.message;
      expect(errMsg).toContain('Overlapping time slots');
    });

    it('rejects room double-booking on overlapping dates and times', async () => {
      // CS-101 has Lab A on Monday 09:00-11:00, dates: 2026-11-01 to 2027-02-01
      const conflictRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'CONFLICT-01',
          title: 'Conflicting Room Booking',
          course_type: 'elective',
          start_date: '2026-11-15',
          end_date: '2026-12-15',
          capacity: 20,
          slots: [
            { day_of_week: 1, start_time: '10:00', end_time: '12:00', room: 'Lab A' },
          ],
        });

      expect(conflictRes.status).toBe(409);
      const errMsg = conflictRes.body.error?.message || conflictRes.body.message;
      expect(errMsg).toContain("Room 'Lab A' is already booked by course 'CS-101'");
    });

    it('allows the same room on different days or non-overlapping date ranges', async () => {
      // Same room 'Lab A' on Friday (different day of week)
      const diffDay = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'OK-ROOM-01',
          title: 'Same Room Different Day',
          course_type: 'elective',
          start_date: '2026-11-01',
          end_date: '2027-02-01',
          capacity: 20,
          slots: [
            { day_of_week: 5, start_time: '09:00', end_time: '11:00', room: 'Lab A' },
          ],
        });
      expect(diffDay.status).toBe(201);

      // Same room 'Lab A' on non-overlapping dates (2027-03-01 to 2027-05-01) on Monday 09:00-11:00
      const diffDates = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'OK-ROOM-02',
          title: 'Same Room Future Dates',
          course_type: 'elective',
          start_date: '2027-03-01',
          end_date: '2027-05-01',
          capacity: 20,
          slots: [
            { day_of_week: 1, start_time: '09:00', end_time: '11:00', room: 'Lab A' },
          ],
        });
      expect(diffDates.status).toBe(201);
    });

    it('rejects trainer double-booking on overlapping dates and times', async () => {
      // Assign staff-trainer-001 to CS-101
      await request(app)
        .patch(`/api/courses/${majorCourseId}`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          trainer_id: 'staff-trainer-001',
        });

      // Attempt to schedule staff-trainer-001 for another course at overlapping time (Mon 10:00-11:30)
      const conflictRes = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({
          code: 'TR-CONFLICT',
          title: 'Trainer Double Booking',
          course_type: 'elective',
          start_date: '2026-11-15',
          end_date: '2026-12-15',
          capacity: 20,
          trainer_id: 'staff-trainer-001',
          slots: [
            { day_of_week: 1, start_time: '10:00', end_time: '11:30', room: 'Room 500' },
          ],
        });

      expect(conflictRes.status).toBe(409);
      const errMsg = conflictRes.body.error?.message || conflictRes.body.message;
      expect(errMsg).toContain("Trainer is already scheduled for course 'CS-101'");
    });

    it('status moves follow allowed rules; course without slots cannot be opened', async () => {
      // 1. Move draft -> open
      const openRes = await request(app)
        .patch(`/api/courses/${electiveCourseId1}/status`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({ status: 'open' });

      expect(openRes.status).toBe(200);
      expect(openRes.body.data.status).toBe('open');

      // 2. Move open -> in_progress
      const inProgRes = await request(app)
        .patch(`/api/courses/${electiveCourseId1}/status`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({ status: 'in_progress' });

      expect(inProgRes.status).toBe(200);
      expect(inProgRes.body.data.status).toBe('in_progress');

      // 3. Move in_progress -> completed
      const compRes = await request(app)
        .patch(`/api/courses/${electiveCourseId1}/status`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({ status: 'completed' });

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.status).toBe('completed');

      // 4. Invalid move: completed -> draft (blocked with 400)
      const invalidMove = await request(app)
        .patch(`/api/courses/${electiveCourseId1}/status`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({ status: 'draft' });

      expect(invalidMove.status).toBe(400);
      const errMsg = invalidMove.body.error?.message || invalidMove.body.message;
      expect(errMsg).toContain("Cannot change course status");
    });
  });

  describe('2. RBAC Security & Permission Isolation', () => {
    it('receptionist and trainer have read access (200) but are blocked from POST and PATCH (403)', async () => {
      // 1. Receptionist read courses list -> 200
      const recList = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(recList.status).toBe(200);

      // 2. Receptionist get stats -> 200
      const recStats = await request(app)
        .get('/api/courses/stats')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(recStats.status).toBe(200);

      // 3. Receptionist POST /api/courses -> 403
      const recPost = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          code: 'FORBIDDEN-01',
          title: 'Forbidden by Receptionist',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2026-12-01',
          capacity: 30,
          slots: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
        });
      expect(recPost.status).toBe(403);

      // 4. Trainer GET /api/courses -> 200
      const trList = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${trainerToken}`);
      expect(trList.status).toBe(200);

      // 5. Trainer POST /api/courses -> 403
      const trPost = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          code: 'FORBIDDEN-02',
          title: 'Forbidden by Trainer',
          course_type: 'major',
          start_date: '2026-11-01',
          end_date: '2026-12-01',
          capacity: 30,
          slots: [{ day_of_week: 1, start_time: '09:00', end_time: '10:00' }],
        });
      expect(trPost.status).toBe(403);
    });

    it('student token is blocked with 403 WRONG_PORTAL', async () => {
      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('WRONG_PORTAL');
    });
  });

  describe('3. Statistics, Search and Filtering', () => {
    it('returns course statistics (total, major, elective, open)', async () => {
      const statsRes = await request(app)
        .get('/api/courses/stats')
        .set('Authorization', `Bearer ${academicAdminToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data).toHaveProperty('total');
      expect(statsRes.body.data).toHaveProperty('major');
      expect(statsRes.body.data).toHaveProperty('elective');
      expect(statsRes.body.data).toHaveProperty('open');
      expect(typeof statsRes.body.data.total).toBe('number');
    });

    it('filters courses by type and search keyword', async () => {
      // Filter by type = major
      const majorOnly = await request(app)
        .get('/api/courses?course_type=major')
        .set('Authorization', `Bearer ${academicAdminToken}`);

      expect(majorOnly.status).toBe(200);
      expect(majorOnly.body.data.courses.every((c: any) => c.course_type === 'major')).toBe(true);

      // Filter by search keyword
      const searchRes = await request(app)
        .get('/api/courses?search=Software')
        .set('Authorization', `Bearer ${academicAdminToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.courses.some((c: any) => c.code === 'CS-101')).toBe(true);
    });
  });
});
