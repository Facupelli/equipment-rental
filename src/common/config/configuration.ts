import z from "zod";

export default () => ({
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  postgres: {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
});

export type Env = z.infer<typeof envSchema>;
