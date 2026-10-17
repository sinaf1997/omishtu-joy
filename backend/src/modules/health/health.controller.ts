import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { checkDatabaseConnection } from '../../config/database.js';
import { env } from '../../config/env.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
}

export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDatabaseConnection();

  if (dbStatus.connected) {
    sendSuccess(res, {
      status: 'ready',
      database: {
        connected: true,
        host: dbStatus.host,
        name: dbStatus.database,
      },
    });
  } else {
    sendError(
      res,
      'Database readiness check failed',
      503,
      'SERVICE_UNAVAILABLE',
      {
        database: {
          connected: false,
          host: dbStatus.host,
          name: dbStatus.database,
          message: dbStatus.error,
        },
      }
    );
  }
}
