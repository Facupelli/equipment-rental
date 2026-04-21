import { z } from "zod";

const locationDeliveryDefaultsResponseSchema = z.object({
  country: z.string().nullable(),
  stateRegion: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const locationListItemResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
  timezone: z.string().nullable(),
  isActive: z.boolean(),
  supportsDelivery: z.boolean(),
  deliveryDefaults: locationDeliveryDefaultsResponseSchema.nullable(),
  createdAt: z.coerce.date(),
});

export const locationListResponseSchema = z.array(
  locationListItemResponseSchema,
);

export type LocationListItemResponse = z.infer<
  typeof locationListItemResponseSchema
>;
export type LocationListResponse = z.infer<typeof locationListResponseSchema>;
