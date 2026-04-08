import { z } from "zod";

const serverEnvSchema = z.object({
  BACKEND_URL: z.url(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  // R2 EQUIPMENT
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
  // R2 BRANDING
  CLOUDFLARE_R2_BRANDING_BUCKET_NAME: z.string().min(1),
  R2_BRANDING_ACCESS_KEY_ID: z.string().min(1),
  R2_BRANDING_SECRET_ACCESS_KEY: z.string().min(1),
  // R2 CUSTOMERS
  R2_CUSTOMERS_BUCKET_NAME: z.string().min(1),
  R2_CUSTOMERS_ACCESS_KEY_ID: z.string().min(1),
  R2_CUSTOMERS_SECRET_ACCESS_KEY: z.string().min(1),
  //
  INTERNAL_API_TOKEN: z.string(),
  ROOT_DOMAIN: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const serverEnv = serverEnvSchema.parse(process.env);
