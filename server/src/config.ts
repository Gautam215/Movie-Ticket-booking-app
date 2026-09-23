import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/eventra'),
  JWT_SECRET: z.string().min(16).default('eventra-development-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  DEMO_MODE: z.enum(['true', 'false']).default('true').transform(value => value === 'true'),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-2.0-flash'),
  TMDB_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
