import { z } from "zod";

const emptyLocationDeliveryDefaults = {
  country: null,
  stateRegion: null,
  city: null,
  postalCode: null,
} as const;

export const locationDeliveryDefaultsSchema = z.object({
  country: z.string().nullable(),
  stateRegion: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().nullable(),
  isActive: z.boolean().default(true),
  supportsDelivery: z.boolean().default(false),
  deliveryDefaults: locationDeliveryDefaultsSchema.default(
    emptyLocationDeliveryDefaults,
  ),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().nullable().optional(),
  supportsDelivery: z.boolean().optional(),
  deliveryDefaults: locationDeliveryDefaultsSchema.optional(),
});

export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
