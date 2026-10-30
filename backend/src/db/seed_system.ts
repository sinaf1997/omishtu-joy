import { runMigrations } from './migrate.js';
import { closeDatabasePool } from '../config/database.js';

export async function seedSystem(): Promise<void> {
  console.log('--- Seeding System Roles and Permissions ---');
  await runMigrations(false);
  await closeDatabasePool();
  console.log('System roles and permissions seeded successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('seed_system.ts')) {
  seedSystem()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('System seeding failed:', err);
      process.exit(1);
    });
}
