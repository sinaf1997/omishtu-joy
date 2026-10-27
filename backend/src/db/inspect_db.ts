import { getDatabasePool, closeDatabasePool } from '../config/database.js';

async function inspectDb() {
  const pool = getDatabasePool();
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('=== SHOW TABLES ===');
    console.table(tables);

    const [courseCols] = await pool.query('DESCRIBE courses');
    console.log('\n=== DESCRIBE courses ===');
    console.table(courseCols);

    const [slotCols] = await pool.query('DESCRIBE course_schedule_slots');
    console.log('\n=== DESCRIBE course_schedule_slots ===');
    console.table(slotCols);
  } catch (e) {
    console.error('Inspection error:', e);
  } finally {
    await closeDatabasePool();
  }
}

inspectDb();
