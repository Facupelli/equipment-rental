import { z } from "zod";

const envSchema = z.object({
  BACKEND_URL: z.url(),
  BETTER_AUTH_URL: z.string().min(32),
  BETTER_AUTH_SECRET: z.string().min(32),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
  // TENANT CONTEXT RESOLUTION
  INTERNAL_API_TOKEN: z.string(),
  ROOT_DOMAIN: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const clientEnvSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_R2_PUBLIC_URL: z.url(),
});

export const serverEnv = envSchema.parse(process.env);
export const clientEnv = clientEnvSchema.parse(import.meta.env);
