import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().nullable(),
  isActive: z.boolean().default(true),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
