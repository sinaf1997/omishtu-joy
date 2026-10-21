import { getDatabasePool, closeDatabasePool } from '../config/database.js';
import { studentsService, getAddisAbabaYearCode } from '../modules/students/students.service.js';
import { authService } from '../modules/auth/auth.service.js';
import { comparePassword } from '../utils/password.js';

async function verifySprint2() {
  console.log('================ SPRINT 2 VERIFICATION SCRIPT ================');
  const pool = getDatabasePool();
  const yearCode = getAddisAbabaYearCode();
  console.log(`Current Addis Ababa Year Code: ${yearCode}`);

  try {
    // 1. Reset counters for test year (or ensure clean sequence test)
    console.log('\n--- 1. Testing Sequence Generation: otc/00001/YY, otc/00002/YY, otc/00003/YY ---');
    const testYear = '88'; // Use dedicated isolated year to test restart & sequence
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM student_id_counters WHERE year_code = ?', [testYear]);
    conn.release();

    // Generate 3 sequential IDs in isolated year
    const conn1 = await pool.getConnection();
    const id1 = await studentsService['repo'].generateNextStudentId(conn1, testYear);
    const id2 = await studentsService['repo'].generateNextStudentId(conn1, testYear);
    const id3 = await studentsService['repo'].generateNextStudentId(conn1, testYear);
    conn1.release();

    console.log(`Generated ID 1: ${id1}`);
    console.log(`Generated ID 2: ${id2}`);
    console.log(`Generated ID 3: ${id3}`);

    if (id1 !== `otc/00001/${testYear}` || id2 !== `otc/00002/${testYear}` || id3 !== `otc/00003/${testYear}`) {
      throw new Error(`Sequence mismatch! Expected otc/00001/${testYear}, otc/00002/${testYear}, otc/00003/${testYear}`);
    }
    console.log('✓ Sequential ID generation verified successfully!');

    // 2. Concurrency Safety: Fire two counter increments simultaneously
    console.log('\n--- 2. Testing Atomic Concurrency Safety ---');
    const concYear = '77';
    const concConn = await pool.getConnection();
    await concConn.query('DELETE FROM student_id_counters WHERE year_code = ?', [concYear]);
    concConn.release();

    const [cConnA, cConnB] = await Promise.all([pool.getConnection(), pool.getConnection()]);
    const [concIdA, concIdB] = await Promise.all([
      studentsService['repo'].generateNextStudentId(cConnA, concYear),
      studentsService['repo'].generateNextStudentId(cConnB, concYear),
    ]);
    cConnA.release();
    cConnB.release();

    console.log(`Concurrent request A got: ${concIdA}`);
    console.log(`Concurrent request B got: ${concIdB}`);
    if (concIdA === concIdB) {
      throw new Error(`Concurrency race condition detected! Both got duplicate: ${concIdA}`);
    }
    console.log('✓ Concurrency test passed: Both requests received distinct atomic IDs!');

    // 3. Real Student Registration in Database
    console.log('\n--- 3. Testing Real In-Person Student Registration ---');
    const testPhone = `+251 91 100 ${Math.floor(1000 + Math.random() * 9000)}`;
    const testEmail = `student_${Date.now()}@omishtu.com`;
    const plainPassword = 'InitialStudentPass123!';

    const createdStudent = await studentsService.createStudent({
      firstName: 'Haile',
      lastName: 'Gebrselassie',
      gender: 'male',
      dateOfBirth: '1995-04-18',
      phone: testPhone,
      email: testEmail,
      address: 'Yeka Subcity',
      city: 'Addis Ababa',
      password: plainPassword,
      confirmPassword: plainPassword,
      emergencyContacts: [
        {
          fullName: 'Abebech Gebrselassie',
          relationship: 'Sister',
          phone: '+251 92 345 6789',
        },
      ],
    });

    console.log(`Registered Student ID: ${createdStudent.studentCode}`);
    console.log(`Name: ${createdStudent.fullName}`);
    console.log(`mustResetPassword: ${createdStudent.mustResetPassword}`);
    console.log(`Emergency Contacts Count: ${createdStudent.emergencyContacts?.length}`);

    if (!createdStudent.studentCode.startsWith(`otc/`) || !createdStudent.studentCode.endsWith(`/${yearCode}`)) {
      throw new Error(`Generated Student ID ${createdStudent.studentCode} does not match otc/NNNNN/${yearCode}`);
    }
    if ((createdStudent as any).password || (createdStudent as any).password_hash) {
      throw new Error('CRITICAL SECURITY FLAW: Password or hash leaked in returned object!');
    }
    console.log('✓ Student registration with otc/NNNNN/YY verified!');

    // 4. Soft Duplicate Warning Check
    console.log('\n--- 4. Testing Duplicate Checks & Soft Warning ---');
    try {
      await studentsService.createStudent({
        firstName: 'Another',
        lastName: 'Person',
        gender: 'female',
        dateOfBirth: '1995-04-18',
        phone: testPhone, // SAME phone & DOB
        password: 'ValidPassword123!',
        emergencyContacts: [{ fullName: 'Contact', relationship: 'Mother', phone: '+251 91 222 3333' }],
      });
      throw new Error('Expected duplicate warning 409 but none thrown!');
    } catch (e: any) {
      if (e.code === 'DUPLICATE_STUDENT_WARNING') {
        console.log(`✓ Soft duplicate warning caught as expected! Existing ID: ${e.existingStudentId || e.message}`);
      } else {
        throw e;
      }
    }

    // Duplicate email check
    try {
      await studentsService.createStudent({
        firstName: 'Unique',
        lastName: 'Person',
        gender: 'female',
        dateOfBirth: '1999-01-01',
        phone: '+251 94 999 8888',
        email: testEmail, // SAME email
        password: 'ValidPassword123!',
        emergencyContacts: [{ fullName: 'Contact', relationship: 'Mother', phone: '+251 91 222 3333' }],
      });
      throw new Error('Expected EMAIL_IN_USE 409 but none thrown!');
    } catch (e: any) {
      if (e.code === 'EMAIL_IN_USE') {
        console.log('✓ Duplicate email rejected as expected with EMAIL_IN_USE!');
      } else {
        throw e;
      }
    }

    // 5. Case-Insensitive Student Login with Trimmed ID
    console.log('\n--- 5. Testing Student Login (Case-insensitive & Spaces Trimmed) ---');
    const upperCasedWithSpaces = `  ${createdStudent.studentCode.toUpperCase()}  `;
    const loginSession = await authService.loginStudent(upperCasedWithSpaces, plainPassword);
    console.log(`Logged in student ID: ${loginSession.user.studentCode}`);
    console.log(`mustResetPassword: ${loginSession.user.mustResetPassword}`);
    if (loginSession.user.mustResetPassword !== true) {
      throw new Error('New student must have mustResetPassword = true on first login!');
    }
    console.log('✓ Case-insensitive and trimmed Student ID login verified!');

    // 6. Student Password Change Flow
    console.log('\n--- 6. Testing Student Password Change ---');
    const newPassword = 'BrandNewStudentPassword999!';
    const changeSession = await authService.changePassword(
      createdStudent.id,
      'student',
      plainPassword,
      newPassword
    );
    console.log(`Password changed. New mustResetPassword: ${changeSession.user.mustResetPassword}`);
    if (changeSession.user.mustResetPassword !== false) {
      throw new Error('mustResetPassword should be false after password change!');
    }

    // Verify old password now fails
    try {
      await authService.loginStudent(createdStudent.studentCode, plainPassword);
      throw new Error('Old password still worked after change!');
    } catch (e: any) {
      if (e.code === 'INVALID_CREDENTIALS') {
        console.log('✓ Old password correctly rejected after change!');
      } else {
        throw e;
      }
    }

    // Verify new password works
    const newLoginSession = await authService.loginStudent(createdStudent.studentCode, newPassword);
    console.log('✓ New password works cleanly!');

    // 7. GET /api/auth/me returns profile and emergency contacts
    console.log('\n--- 7. Testing getMe Profile & Emergency Contacts ---');
    const me = await authService.getMe(createdStudent.id, 'student');
    console.log(`me.fullName: ${me.fullName}`);
    console.log(`me.emergencyContacts: ${JSON.stringify(me.emergencyContacts)}`);
    if (!me.emergencyContacts || me.emergencyContacts.length === 0) {
      throw new Error('Emergency contacts missing in getMe response!');
    }
    console.log('✓ getMe returns complete profile and emergency contacts!');

    console.log('\n================ ALL SPRINT 2 VERIFICATIONS PASSED! ================');
  } finally {
    await closeDatabasePool();
  }
}

verifySprint2().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
