import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  JWT_SECRET: z.string(),
  JWT_EXPIRATION_TIME_SECONDS: z.coerce.number().default(3600),

  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRATION_TIME_SECONDS: z.coerce.number().default(604800), // 7 days

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_AUTH_STATE_SECRET: z.string(),
  GOOGLE_AUTH_STATE_EXPIRATION_TIME_SECONDS: z.coerce.number().default(600),
  GOOGLE_AUTH_HANDOFF_EXPIRATION_TIME_SECONDS: z.coerce.number().default(300),

  CLOUDFLARE_API_TOKEN: z.string(),
  CLOUDFLARE_ZONE_ID: z.string(),

  INTERNAL_API_TOKEN: z.string(),
  ROOT_DOMAIN: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;
