import z from "zod";

export const nullableOptional = <T>(schema: z.ZodType<T>) =>
  schema
    .nullable()
    .optional()
    .transform((v) => v ?? null);
