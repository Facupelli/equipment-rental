import { z } from "zod";
import { nullableOptional } from "../shared";

export const LocationSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  name: z.string(),
  address: nullableOptional(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const LocationCreateSchema = LocationSchema.omit({
  id: true,
  tenantId: true,
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

// RESPONSE SCHEMA

export const LocationListItemSchema = LocationSchema.pick({
  id: true,
  name: true,
  address: true,
  isActive: true,
  createdAt: true,
});
export type LocationListItem = z.infer<typeof LocationListItemSchema>;
export const LocationListResponseSchema = z.array(LocationListItemSchema);
export type LocationListResponse = z.infer<typeof LocationListResponseSchema>;
