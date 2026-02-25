import { z } from "zod";

const envSchema = z.object({
  NESTJS_API_URL: z.url(),
  BETTER_AUTH_URL: z.string().min(32),
  BETTER_AUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const clientEnvSchema = z.object({
  VITE_API_URL: z.url(),
});

export const serverEnv = envSchema.parse(process.env);
export const clientEnv = clientEnvSchema.parse(import.meta.env);
