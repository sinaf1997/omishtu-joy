import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../app.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { hashPassword } from '../utils/password.js';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';

describe('Enrollments Module, Waitlists & Business Rules Integration Tests', () => {
  const app = createApp();

  let academicAdminToken: string;
  let receptionistToken: string;
  let trainerToken: string;
  let studentToken: string;

  const testStudentId1 = 'student-test-001';
  const testStudentId2 = 'student-test-002';
  const testStudentId3 = 'student-test-003';
  const testStudentId4 = 'student-test-004';
  const testStudentId5 = 'student-test-005';

  beforeAll(async () => {
    const pool = getDatabasePool();
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM waitlist_entries');
    await pool.query('DELETE FROM enrollments');
    await pool.query('DELETE FROM course_schedule_slots');
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM students WHERE id LIKE "student-test-%"');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert test students
    const dummyHash = await hashPassword('StudentPass123!');
    const students = [
      [testStudentId1, 'otc/90001/26', 'Abebe', 'Bikila', 'abebe.test@omishtu.com', '+251911990001', dummyHash, 1],
      [testStudentId2, 'otc/90002/26', 'Bethlehem', 'Tilahun', 'betty.test@omishtu.com', '+251911990002', dummyHash, 1],
      [testStudentId3, 'otc/90003/26', 'Chala', 'Debebe', 'chala.test@omishtu.com', '+251911990003', dummyHash, 1],
      [testStudentId4, 'otc/90004/26', 'Dawit', 'Tsige', 'dawit.test@omishtu.com', '+251911990004', dummyHash, 1],
      [testStudentId5, 'otc/90005/26', 'Eleni', 'Gebre', 'eleni.test@omishtu.com', '+251911990005', dummyHash, 1],
    ];

    for (const s of students) {
      await pool.query(
        `INSERT INTO students (id, student_code, first_name, last_name, email, phone, password_hash, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        s
      );
    }
  });

  afterAll(async () => {
    const pool = getDatabasePool();
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM waitlist_entries');
    await pool.query('DELETE FROM enrollments');
    await pool.query('DELETE FROM course_schedule_slots');
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM students WHERE id LIKE "student-test-%"');
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

    const academicStaff = createStaff('academic_admin', 'staff-academics-001', 'Prof. Marcus Vance');
    const receptionStaff = createStaff('receptionist', 'staff-receptionist-001', 'Sara Kebede');
    const trainerStaff = createStaff('trainer', 'staff-trainer-001', 'Elena Rostova');

    vi.spyOn(usersRepository, 'findStaffByEmail').mockImplementation(async (email: string) => {
      if (email === 'academic_admin@omishtu.com') return academicStaff;
      if (email === 'receptionist@omishtu.com') return receptionStaff;
      if (email === 'trainer@omishtu.com') return trainerStaff;
      return null;
    });
    vi.spyOn(usersRepository, 'updateStaffLastLogin').mockResolvedValue();
    vi.spyOn(usersRepository, 'isStaffActive').mockResolvedValue(true);
    vi.spyOn(usersRepository, 'isStudentActive').mockResolvedValue(true);

    const adminLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'academic_admin@omishtu.com', password: 'ValidPass123!' });
    academicAdminToken = adminLogin.body.data.token;

    const recLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'receptionist@omishtu.com', password: 'ValidPass123!' });
    receptionistToken = recLogin.body.data.token;

    const trLogin = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'trainer@omishtu.com', password: 'ValidPass123!' });
    trainerToken = trLogin.body.data.token;

    const mockStudent = {
      id: testStudentId1,
      student_code: 'otc/90001/26',
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
      .send({ studentCode: 'otc/90001/26', password: 'ValidPass123!' });
    studentToken = studentLogin.body.data.token;
  });

  // Helper to create and open a course
  async function createAndOpenCourse(params: {
    code: string;
    title: string;
    course_type: 'major' | 'elective';
    capacity: number;
    slots: { day_of_week: number; start_time: string; end_time: string }[];
    start_date?: string;
    end_date?: string;
  }): Promise<string> {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${academicAdminToken}`)
      .send({
        code: params.code,
        title: params.title,
        course_type: params.course_type,
        capacity: params.capacity,
        start_date: params.start_date || '2026-11-01',
        end_date: params.end_date || '2027-01-31',
        slots: params.slots,
      });

    const courseId = res.body.data.id;

    // Open the course
    await request(app)
      .patch(`/api/courses/${courseId}/status`)
      .set('Authorization', `Bearer ${academicAdminToken}`)
      .send({ status: 'open' });

    return courseId;
  }

  describe('1. Live Preview and Successful Enrollment', () => {
    it('checks eligibility and enrolls student successfully', async () => {
      const courseId = await createAndOpenCourse({
        code: 'CS-SE-101',
        title: 'Full Stack Engineering',
        course_type: 'major',
        capacity: 25,
        slots: [{ day_of_week: 1, start_time: '08:00', end_time: '10:00' }],
      });

      // 1. Live Preview Check
      const checkRes = await request(app)
        .post('/api/enrollments/check')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: courseId });

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.outcome).toBe('enroll');
      expect(checkRes.body.data.seats_left).toBe(25);
      expect(checkRes.body.data.reasons).toEqual([]);

      // 2. Real Enrollment
      const enrollRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: courseId });

      expect(enrollRes.status).toBe(201);
      expect(enrollRes.body.data.type).toBe('enrolled');
      expect(enrollRes.body.data.enrollment.status).toBe('active');
      expect(enrollRes.body.data.enrollment.source).toBe('direct');

      // 3. Verify Roster & Enrolled Count
      const rosterRes = await request(app)
        .get(`/api/courses/${courseId}/roster`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(rosterRes.status).toBe(200);
      expect(rosterRes.body.data.summary.enrolled_count).toBe(1);
      expect(rosterRes.body.data.summary.seats_left).toBe(24);
      expect(rosterRes.body.data.enrolled.length).toBe(1);
      expect(rosterRes.body.data.enrolled[0].student_code).toBe('otc/90001/26');

      // 4. Verify Student Enrollments Endpoint
      const studentHistory = await request(app)
        .get(`/api/students/${testStudentId1}/enrollments`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(studentHistory.status).toBe(200);
      expect(studentHistory.body.data.enrollments.length).toBe(1);
      expect(studentHistory.body.data.enrollments[0].course_code).toBe('CS-SE-101');
    });
  });

  describe('2. Major and Elective Course Type Limits', () => {
    it('blocks enrollment into a 2nd active major course (max 1)', async () => {
      // testStudentId1 already has CS-SE-101 (major)
      const major2Id = await createAndOpenCourse({
        code: 'CS-AI-201',
        title: 'Artificial Intelligence Major',
        course_type: 'major',
        capacity: 20,
        slots: [{ day_of_week: 2, start_time: '14:00', end_time: '16:00' }],
      });

      const checkRes = await request(app)
        .post('/api/enrollments/check')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: major2Id });

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.outcome).toBe('blocked');
      expect(checkRes.body.data.reasons.some((r: string) => r.includes('maximum of 1 active major'))).toBe(true);

      const enrollRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: major2Id });

      expect(enrollRes.status).toBe(422);
      expect(enrollRes.body.error.code).toBe('ENROLLMENT_RULES_FAILED');
    });

    it('blocks enrollment into a 4th active elective course (max 3)', async () => {
      // Create 4 electives on different non-conflicting slots
      const el1 = await createAndOpenCourse({
        code: 'ELEC-01',
        title: 'Elective 1',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 2, start_time: '08:00', end_time: '10:00' }],
      });
      const el2 = await createAndOpenCourse({
        code: 'ELEC-02',
        title: 'Elective 2',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 3, start_time: '08:00', end_time: '10:00' }],
      });
      const el3 = await createAndOpenCourse({
        code: 'ELEC-03',
        title: 'Elective 3',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 4, start_time: '08:00', end_time: '10:00' }],
      });
      const el4 = await createAndOpenCourse({
        code: 'ELEC-04',
        title: 'Elective 4',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 5, start_time: '08:00', end_time: '10:00' }],
      });

      // Enroll in 3 electives
      for (const elId of [el1, el2, el3]) {
        const res = await request(app)
          .post('/api/enrollments')
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({ student_id: testStudentId1, course_id: elId });
        expect(res.status).toBe(201);
      }

      // 4th elective must be blocked
      const checkRes = await request(app)
        .post('/api/enrollments/check')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: el4 });

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.outcome).toBe('blocked');
      expect(checkRes.body.data.reasons.some((r: string) => r.includes('maximum of 3 active elective'))).toBe(true);

      const enrollRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: el4 });

      expect(enrollRes.status).toBe(422);
      expect(enrollRes.body.error.code).toBe('ENROLLMENT_RULES_FAILED');
    });
  });

  describe('3. Timetable Conflict Detection', () => {
    it('detects slot collision and names the conflicting course code', async () => {
      // testStudentId2 has no enrollments yet
      const baseCourseId = await createAndOpenCourse({
        code: 'TIME-BASE-1',
        title: 'Morning Python Basics',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 3, start_time: '10:00', end_time: '12:00' }],
      });

      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId2, course_id: baseCourseId });

      // Create overlapping course: same day (Wed), overlapping time (11:00-13:00)
      const clashCourseId = await createAndOpenCourse({
        code: 'TIME-CLASH-1',
        title: 'Overlapping Afternoon Workshop',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 3, start_time: '11:00', end_time: '13:00' }],
      });

      const checkRes = await request(app)
        .post('/api/enrollments/check')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId2, course_id: clashCourseId });

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.outcome).toBe('blocked');
      expect(checkRes.body.data.reasons.some((r: string) => r.includes('TIME-BASE-1'))).toBe(true);
    });
  });

  describe('4. Capacity Limits, Waitlists and Promotion', () => {
    it('handles full course, waitlist positioning, and promotion on drop', async () => {
      // Create course with capacity = 1
      const tinyCourseId = await createAndOpenCourse({
        code: 'TINY-01',
        title: 'Single Seat Masterclass',
        course_type: 'elective',
        capacity: 1,
        slots: [{ day_of_week: 6, start_time: '09:00', end_time: '11:00' }],
      });

      // 1. Student 3 takes the only seat
      const enroll1 = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId3, course_id: tinyCourseId });
      expect(enroll1.status).toBe(201);
      expect(enroll1.body.data.type).toBe('enrolled');
      const student3EnrollmentId = enroll1.body.data.enrollment.id;

      // 2. Student 4 checks eligibility -> outcome: waitlist, position: 1
      const checkWaitlist = await request(app)
        .post('/api/enrollments/check')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId4, course_id: tinyCourseId });
      expect(checkWaitlist.status).toBe(200);
      expect(checkWaitlist.body.data.outcome).toBe('waitlist');
      expect(checkWaitlist.body.data.seats_left).toBe(0);
      expect(checkWaitlist.body.data.waitlist_position_if_added).toBe(1);

      // 3. Student 4 enrolling without join_waitlist_if_full fails with 409
      const failEnroll = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId4, course_id: tinyCourseId });
      expect(failEnroll.status).toBe(409);
      expect(failEnroll.body.error.code).toBe('COURSE_FULL');

      // 4. Student 4 joins waitlist with join_waitlist_if_full: true
      const joinWaitlist = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId4, course_id: tinyCourseId, join_waitlist_if_full: true });
      expect(joinWaitlist.status).toBe(201);
      expect(joinWaitlist.body.data.type).toBe('waitlisted');
      expect(joinWaitlist.body.data.position).toBe(1);
      const student4WaitlistId = joinWaitlist.body.data.waitlist_entry.id;

      // 5. Roster shows Student 3 enrolled and Student 4 in waitlist
      const roster1 = await request(app)
        .get(`/api/courses/${tinyCourseId}/roster`)
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(roster1.body.data.summary.enrolled_count).toBe(1);
      expect(roster1.body.data.summary.waitlist_count).toBe(1);
      expect(roster1.body.data.waitlist[0].position).toBe(1);

      // 6. Receptionist drops Student 3
      const dropRes = await request(app)
        .patch(`/api/enrollments/${student3EnrollmentId}/drop`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ reason: 'Student relocated to another city' });
      expect(dropRes.status).toBe(200);
      expect(dropRes.body.data.enrollment.status).toBe('dropped');

      // 7. Promote Student 4 from waitlist
      const promoteRes = await request(app)
        .post(`/api/courses/${tinyCourseId}/waitlist/promote-next`)
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.data.enrollment.status).toBe('active');
      expect(promoteRes.body.data.enrollment.source).toBe('waitlist');

      // 8. Roster now shows Student 4 as enrolled, waitlist empty
      const roster2 = await request(app)
        .get(`/api/courses/${tinyCourseId}/roster`)
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(roster2.body.data.summary.enrolled_count).toBe(1);
      expect(roster2.body.data.summary.waitlist_count).toBe(0);
      expect(roster2.body.data.enrolled[0].student_id).toBe(testStudentId4);
    });

    it('reactivates dropped enrollment when student re-enrolls', async () => {
      const courseId = await createAndOpenCourse({
        code: 'REACTIVATION-01',
        title: 'Reactivation Test Course',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 7, start_time: '10:00', end_time: '12:00' }],
      });

      // 1. Initial enrollment
      const res1 = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId5, course_id: courseId });
      const enrollmentId = res1.body.data.enrollment.id;

      // 2. Drop student
      await request(app)
        .patch(`/api/enrollments/${enrollmentId}/drop`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ reason: 'Temporary personal leave' });

      // 3. Re-enroll student
      const res2 = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId5, course_id: courseId });

      expect(res2.status).toBe(201);
      expect(res2.body.data.enrollment.id).toBe(enrollmentId);
      expect(res2.body.data.enrollment.status).toBe('active');
      expect(res2.body.data.enrollment.dropped_at).toBeNull();
      expect(res2.body.data.enrollment.drop_reason).toBeNull();
    });
  });

  describe('5. Concurrency Race Condition Safety', () => {
    it('guarantees only 1 student gets enrolled when 2 concurrent requests compete for 1 seat', async () => {
      const pool = getDatabasePool();
      await pool.query('DELETE FROM waitlist_entries');
      await pool.query('DELETE FROM enrollments');

      const raceCourseId = await createAndOpenCourse({
        code: 'RACE-01',
        title: 'Race Condition Single Seat Course',
        course_type: 'elective',
        capacity: 1,
        slots: [{ day_of_week: 6, start_time: '14:00', end_time: '16:00' }],
      });

      // Two students simultaneously send enrollment requests for the final seat
      const [req1, req2] = await Promise.all([
        request(app)
          .post('/api/enrollments')
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({ student_id: testStudentId1, course_id: raceCourseId, join_waitlist_if_full: false }),
        request(app)
          .post('/api/enrollments')
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({ student_id: testStudentId2, course_id: raceCourseId, join_waitlist_if_full: false }),
      ]);

      const statuses = [req1.status, req2.status].sort();
      // Exactly one succeeds (201) and the other fails with course full (409)
      expect(statuses).toEqual([201, 409]);

      // Roster must show exactly 1 enrolled student
      const roster = await request(app)
        .get(`/api/courses/${raceCourseId}/roster`)
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(roster.body.data.summary.enrolled_count).toBe(1);
    });
  });

  describe('6. Capacity Lower Limit and Course Status Hooks', () => {
    it('blocks decreasing course capacity below current enrolled count', async () => {
      const capCourseId = await createAndOpenCourse({
        code: 'CAP-LIMIT-01',
        title: 'Capacity Lower Limit Course',
        course_type: 'elective',
        capacity: 2,
        slots: [{ day_of_week: 1, start_time: '16:00', end_time: '18:00' }],
      });

      // Enroll 2 students to fill capacity
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId3, course_id: capCourseId });
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId4, course_id: capCourseId });

      // Try lowering capacity to 1 (below enrolled count of 2)
      const patchRes = await request(app)
        .patch(`/api/courses/${capCourseId}`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({ capacity: 1 });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error.message).toMatch(/cannot be lowered below current enrolled count/i);
    });

    it('cancels active enrollments and removes waitlists when course is cancelled', async () => {
      const pool = getDatabasePool();
      await pool.query('DELETE FROM waitlist_entries');
      await pool.query('DELETE FROM enrollments');

      const cancelCourseId = await createAndOpenCourse({
        code: 'CANCEL-HOOK-01',
        title: 'Cancellation Hook Test Course',
        course_type: 'elective',
        capacity: 1,
        slots: [{ day_of_week: 2, start_time: '16:00', end_time: '18:00' }],
      });

      // Enroll student 5
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId5, course_id: cancelCourseId });

      // Student 1 joins waitlist
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({ student_id: testStudentId1, course_id: cancelCourseId, join_waitlist_if_full: true });

      // Cancel course
      const cancelRes = await request(app)
        .patch(`/api/courses/${cancelCourseId}/status`)
        .set('Authorization', `Bearer ${academicAdminToken}`)
        .send({ status: 'cancelled' });
      expect(cancelRes.status).toBe(200);

      // Verify enrollments table updated to cancelled
      const [enrollmentRows] = await pool.query<any[]>(
        `SELECT status FROM enrollments WHERE course_id = ?`,
        [cancelCourseId]
      );
      expect(enrollmentRows[0].status).toBe('cancelled');

      // Verify waitlist entry updated to removed with reason 'Course cancelled'
      const [waitlistRows] = await pool.query<any[]>(
        `SELECT status, removal_reason FROM waitlist_entries WHERE course_id = ?`,
        [cancelCourseId]
      );
      expect(waitlistRows[0].status).toBe('removed');
      expect(waitlistRows[0].removal_reason).toBe('Course cancelled');
    });
  });

  describe('7. RBAC & Portal Isolation', () => {
    it('allows trainer to read roster but blocks trainer from enrollments:manage (403)', async () => {
      const rbacCourseId = await createAndOpenCourse({
        code: 'RBAC-ROSTER-01',
        title: 'RBAC Test Course',
        course_type: 'elective',
        capacity: 10,
        slots: [{ day_of_week: 5, start_time: '14:00', end_time: '16:00' }],
      });

      // Trainer can read roster (has courses:read)
      const rosterRes = await request(app)
        .get(`/api/courses/${rbacCourseId}/roster`)
        .set('Authorization', `Bearer ${trainerToken}`);
      expect(rosterRes.status).toBe(200);

      // Trainer is blocked from enrolling students (needs enrollments:manage)
      const enrollRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ student_id: testStudentId1, course_id: rbacCourseId });
      expect(enrollRes.status).toBe(403);
    });

    it('blocks student token from accessing staff enrollment endpoints with 403 WRONG_PORTAL', async () => {
      const studentRes = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(studentRes.status).toBe(403);
      expect(studentRes.body.error.code).toBe('WRONG_PORTAL');
    });
  });
});
