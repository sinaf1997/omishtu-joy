import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, corsOrigin } from './config/env.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? corsOrigin : [corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Request Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
