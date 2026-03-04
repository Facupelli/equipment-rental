import { z } from "zod";

export const LocationSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  address: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const LocationCreateSchema = LocationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const LocationUpdateSchema = LocationSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type Location = z.infer<typeof LocationSchema>;
export type LocationCreate = z.infer<typeof LocationCreateSchema>;
export type LocationUpdate = z.infer<typeof LocationUpdateSchema>;

export const LocationListResponseSchema = z.array(LocationSchema);
export type LocationListResponse = z.infer<typeof LocationListResponseSchema>;
