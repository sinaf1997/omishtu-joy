import { RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env.js';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { runMigrations } from './migrate.js';

interface SeedStaff {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  password: string;
  mustResetPassword: boolean;
}

interface SeedStudent {
  id: string;
  studentCode: string;
  password: string;
  mustResetPassword: boolean;
}

interface RoleRow extends RowDataPacket {
  id: string;
  name: string;
}

async function runSeed(): Promise<void> {
  console.log('--- Starting Development Seed Runner ---');

  if (env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: Dev seed runner refuses to run in production environment!');
    process.exit(1);
  }

  // 1. Ensure migrations and foundation tables exist before seeding
  try {
    await runMigrations(false);
  } catch (migError) {
    console.error('Failed to apply required migrations before seeding:', migError);
    process.exit(1);
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    // 2. Defensively ensure the 6 system roles exist before staff insertion
    await connection.query(`
      INSERT INTO roles (id, name, display_name, description, is_system)
      VALUES
        ('role-owner', 'owner', 'Center Owner', 'Full administrative authority and financial governance', 1),
        ('role-manager', 'manager', 'Operations Manager', 'Operational oversight, schedule sign-off, and staff management', 1),
        ('role-academic-admin', 'academic_admin', 'Academic Administrator', 'Course catalog, cohorts, timetable planning, and graduation', 1),
        ('role-trainer', 'trainer', 'Course Trainer / Instructor', 'Class attendance, assessments, and student performance grading', 1),
        ('role-accountant', 'accountant', 'Finance & Accountant', 'Tuition invoicing, payment cashiering, AR/AP, and bank reconciliation', 1),
        ('role-receptionist', 'receptionist', 'Front Desk / Receptionist', 'In-person student intake, inquiry logging, and credential issuance', 1)
      ON DUPLICATE KEY UPDATE
        display_name = VALUES(display_name),
        description = VALUES(description);
    `);

    // Fetch actual role IDs mapped by role name
    const [roleRows] = await connection.query<RoleRow[]>('SELECT id, name FROM roles');
    const roleNameToId = new Map<string, string>();
    for (const role of roleRows) {
      roleNameToId.set(role.name, role.id);
    }

    const ownerEmail = env.SEED_OWNER_EMAIL || 'owner@gmail.com';
    const ownerPassword = env.SEED_OWNER_PASSWORD || '12345678';
    const devPassword = 'DevPassword123!';

    const staffAccounts: SeedStaff[] = [
      {
        id: 'staff-owner-001',
        fullName: 'Alexander Wright (Owner)',
        email: ownerEmail,
        roleId: roleNameToId.get('owner') || 'role-owner',
        roleName: 'owner',
        password: ownerPassword,
        mustResetPassword: true, // Owner seeded with must_reset_password = true
      },
      {
        id: 'staff-receptionist-001',
        fullName: 'Sara Kebede (Receptionist)',
        email: 'receptionist@omishtu.com',
        roleId: roleNameToId.get('receptionist') || 'role-receptionist',
        roleName: 'receptionist',
        password: devPassword,
        mustResetPassword: false,
      },
      {
        id: 'staff-academics-001',
        fullName: 'Prof. Marcus Vance (Academic Admin)',
        email: 'academics@omishtu.com',
        roleId: roleNameToId.get('academic_admin') || 'role-academic-admin',
        roleName: 'academic_admin',
        password: devPassword,
        mustResetPassword: false,
      },
      {
        id: 'staff-trainer-001',
        fullName: 'Elena Rostova (Trainer)',
        email: 'trainer@omishtu.com',
        roleId: roleNameToId.get('trainer') || 'role-trainer',
        roleName: 'trainer',
        password: devPassword,
        mustResetPassword: false,
      },
      {
        id: 'staff-accountant-001',
        fullName: 'David Sterling (Accountant)',
        email: 'accountant@omishtu.com',
        roleId: roleNameToId.get('accountant') || 'role-accountant',
        roleName: 'accountant',
        password: devPassword,
        mustResetPassword: false,
      },
      {
        id: 'staff-manager-001',
        fullName: 'Olivia Chen (Manager)',
        email: 'manager@omishtu.com',
        roleId: roleNameToId.get('manager') || 'role-manager',
        roleName: 'manager',
        password: devPassword,
        mustResetPassword: false,
      },
    ];

    const studentAccounts: SeedStudent[] = [
      {
        id: 'student-seed-001',
        studentCode: 'STD-2026-001',
        password: devPassword,
        mustResetPassword: false,
      },
      {
        id: 'student-seed-002',
        studentCode: 'STD-2026-002',
        password: devPassword,
        mustResetPassword: true,
      },
    ];

    console.log('\n--- Seeding Staff Accounts ---');
    for (const staff of staffAccounts) {
      const passwordHash = await hashPassword(staff.password);
      const targetRoleId = roleNameToId.get(staff.roleName) || staff.roleId;

      await connection.query(
        `INSERT INTO staff (id, full_name, email, password_hash, role_id, must_reset_password, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           email = VALUES(email),
           password_hash = VALUES(password_hash),
           role_id = VALUES(role_id),
           must_reset_password = VALUES(must_reset_password),
           is_active = 1`,
        [staff.id, staff.fullName, staff.email, passwordHash, targetRoleId, staff.mustResetPassword ? 1 : 0]
      );
    }

    console.log('\n--- Seeding Student Accounts ---');
    for (const student of studentAccounts) {
      const passwordHash = await hashPassword(student.password);
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
    console.log('PRIMARY OWNER LOGIN (/staff/login):');
    console.log(`  - Email:    ${ownerEmail}`);
    console.log(`  - Password: ${ownerPassword}`);
    console.log(`  - Role:     owner (must_reset_password: true)`);
    console.log('\nOTHER STAFF PORTAL LOGINS (Password: DevPassword123!):');
    for (const s of staffAccounts.slice(1)) {
      console.log(`  - [${s.roleName.padEnd(14)}] ${s.email.padEnd(26)} (Must Reset: ${s.mustResetPassword})`);
    }
    console.log('\nSTUDENT PORTAL LOGINS (/student/login - Password: DevPassword123!):');
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
