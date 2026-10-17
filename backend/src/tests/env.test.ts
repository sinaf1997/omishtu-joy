import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Environment Configuration Schema', () => {
  const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    JWT_SECRET: z.string().min(32),
  });

  it('validates a correct environment payload', () => {
    const valid = {
      NODE_ENV: 'test',
      PORT: '5000',
      FRONTEND_URL: 'http://localhost:5173',
      JWT_SECRET: 'a_very_secure_secret_key_that_is_at_least_32_characters_long',
    };

    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(5000);
    }
  });

  it('fails if JWT_SECRET is shorter than 32 characters', () => {
    const invalid = {
      JWT_SECRET: 'too_short',
    };

    const result = schema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
