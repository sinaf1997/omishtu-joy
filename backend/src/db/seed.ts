import { env } from '../config/env.js';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

interface SeedStaff {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  mustResetPassword: boolean;
}

interface SeedStudent {
  id: string;
  studentCode: string;
  mustResetPassword: boolean;
}

async function runSeed(): Promise<void> {
  console.log('--- Starting Development Seed Runner ---');

  if (env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: Dev seed runner refuses to run in production environment!');
    process.exit(1);
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    const defaultPassword = 'DevPassword123!';
    const passwordHash = await hashPassword(defaultPassword);

    const staffAccounts: SeedStaff[] = [
      {
        id: 'staff-owner-001',
        fullName: 'Alexander Wright (Owner)',
        email: 'owner@omishtu.com',
        roleId: 'role-owner',
        roleName: 'owner',
        mustResetPassword: false,
      },
      {
        id: 'staff-receptionist-001',
        fullName: 'Sara Kebede (Receptionist)',
        email: 'receptionist@omishtu.com',
        roleId: 'role-receptionist',
        roleName: 'receptionist',
        mustResetPassword: false,
      },
      {
        id: 'staff-academics-001',
        fullName: 'Prof. Marcus Vance (Academic Admin)',
        email: 'academics@omishtu.com',
        roleId: 'role-academic-admin',
        roleName: 'academic_admin',
        mustResetPassword: false,
      },
      {
        id: 'staff-trainer-001',
        fullName: 'Elena Rostova (Trainer)',
        email: 'trainer@omishtu.com',
        roleId: 'role-trainer',
        roleName: 'trainer',
        mustResetPassword: false,
      },
      {
        id: 'staff-accountant-001',
        fullName: 'David Sterling (Accountant)',
        email: 'accountant@omishtu.com',
        roleId: 'role-accountant',
        roleName: 'accountant',
        mustResetPassword: false,
      },
      {
        id: 'staff-manager-001',
        fullName: 'Olivia Chen (Manager)',
        email: 'manager@omishtu.com',
        roleId: 'role-manager',
        roleName: 'manager',
        mustResetPassword: false,
      },
      {
        id: 'staff-reset-test-001',
        fullName: 'Jordan Reset (Staff Pending Setup)',
        email: 'newstaff@omishtu.com',
        roleId: 'role-trainer',
        roleName: 'trainer',
        mustResetPassword: true,
      },
    ];

    const studentAccounts: SeedStudent[] = [
      {
        id: 'student-seed-001',
        studentCode: 'STD-2026-001',
        mustResetPassword: false,
      },
      {
        id: 'student-seed-002',
        studentCode: 'STD-2026-002',
        mustResetPassword: true,
      },
    ];

    console.log('\n--- Seeding Staff Accounts ---');
    for (const staff of staffAccounts) {
      await connection.query(
        `INSERT INTO staff (id, full_name, email, password_hash, role_id, must_reset_password, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           password_hash = VALUES(password_hash),
           role_id = VALUES(role_id),
           must_reset_password = VALUES(must_reset_password),
           is_active = 1`,
        [staff.id, staff.fullName, staff.email, passwordHash, staff.roleId, staff.mustResetPassword ? 1 : 0]
      );
    }

    console.log('\n--- Seeding Student Accounts ---');
    for (const student of studentAccounts) {
      await connection.query(
        `INSERT INTO students (id, student_code, password_hash, must_reset_password, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           must_reset_password = VALUES(must_reset_password),
           is_active = 1`,
        [student.id, student.studentCode, passwordHash, student.mustResetPassword ? 1 : 0]
      );
    }

    console.log('\n======================================================');
    console.log('  DEV SEED COMPLETED - CREDENTIALS (CONSOLE ONLY)     ');
    console.log('======================================================');
    console.log('All accounts share initial dev password: ' + defaultPassword);
    console.log('\nSTAFF PORTAL LOGINS (/staff/login):');
    for (const s of staffAccounts) {
      console.log(`  - [${s.roleName.padEnd(14)}] ${s.email.padEnd(26)} (Must Reset: ${s.mustResetPassword})`);
    }
    console.log('\nSTUDENT PORTAL LOGINS (/student/login):');
    for (const st of studentAccounts) {
      console.log(`  - Student ID: ${st.studentCode} (Must Reset: ${st.mustResetPassword})`);
    }
    console.log('======================================================\n');
  } catch (error) {
    console.error('Seed execution failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    await closeDatabasePool();
  }
}

runSeed();
