import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabasePool } from './config/database.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(`Backend Server running in [${env.NODE_ENV}] mode`);
  console.log(`Listening on: http://localhost:${env.PORT}`);
  console.log(`Health endpoint: http://localhost:${env.PORT}/api/health`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
async function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await closeDatabasePool();
      console.log('Database connection pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database pool closure:', err);
      process.exit(1);
    }
  });

  // Force close if it takes too long
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
