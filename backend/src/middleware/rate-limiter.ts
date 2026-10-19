import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter({
  windowMs = 60 * 1000, // 1 minute
  max = 15,             // 15 attempts per minute
  message = 'Too many login attempts. Please wait a moment before trying again.',
} = {}) {
  const ipStore = new Map<string, RateLimitRecord>();

  // Periodically clean expired keys
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ipStore.entries()) {
      if (now > value.resetAt) {
        ipStore.delete(key);
      }
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, skip rate limiting to avoid flaky test runs
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = ipStore.get(ip);

    if (!record || now > record.resetAt) {
      ipStore.set(ip, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      sendError(res, message, 429, 'TOO_MANY_REQUESTS');
      return;
    }

    record.count += 1;
    next();
  };
}

export const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again after 1 minute.',
});
