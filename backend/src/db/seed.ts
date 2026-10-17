import { env } from '../config/env.js';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';
import { hashPassword } from '../utils/password.js';

async function runSeed(): Promise<void> {
  console.log('--- Starting Development Seed Runner ---');

  if (env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: Seed runner cannot be executed in production environment!');
    process.exit(1);
  }

  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    console.log('Seeding initial development users...');
    const devPassword = 'DevPassword123!';
    const passwordHash = await hashPassword(devPassword);

    const devUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@dev.local',
        role: 'admin',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'staff@dev.local',
        role: 'staff',
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'user@dev.local',
        role: 'user',
      },
    ];

    for (const u of devUsers) {
      await connection.query(
        `INSERT INTO users (id, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           is_active = 1`,
        [u.id, u.email, passwordHash, u.role]
      );
      console.log(`Seeded/Updated dev account: ${u.email} (${u.role})`);
    }

    console.log('\nDevelopment seeding completed successfully.');
    console.log('Note: Dev account passwords are: DevPassword123!');
  } catch (error) {
    console.error('Seed execution failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    await closeDatabasePool();
  }
}

runSeed();
