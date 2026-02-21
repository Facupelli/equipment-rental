import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
});

export type Env = z.infer<typeof EnvSchema>;
