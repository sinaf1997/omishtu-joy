import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search and load .env from cwd, backend root, or workspace root
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // MySQL Database Configuration
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1).default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1).default('omishtu'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, {
    message: 'JWT_SECRET must be at least 32 characters long for security',
  }),
  JWT_EXPIRES_IN: z.string().min(1).default('8h'),

  // Cloudinary (Optional media storage)
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  // Dev Seeding Configuration
  SEED_OWNER_EMAIL: z.string().email().default('owner@gmail.com'),
  SEED_OWNER_PASSWORD: z.string().min(6).default('12345678'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export type Env = z.infer<typeof envSchema>;
export const env: Env = parsedEnv.success
  ? parsedEnv.data
  : (process.env as unknown as Env);

// Normalized frontend/CORS URL
export const corsOrigin = env.CORS_ORIGIN || env.FRONTEND_URL;
