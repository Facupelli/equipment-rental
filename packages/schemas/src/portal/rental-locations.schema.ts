import { z } from "zod";

const rentalLocationDeliveryDefaultsSchema = z.object({
  country: z.string().nullable(),
  stateRegion: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const rentalLocationResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
  supportsDelivery: z.boolean(),
  deliveryDefaults: rentalLocationDeliveryDefaultsSchema.nullable(),
  createdAt: z.coerce.date(),
});

export const rentalLocationsResponseSchema = z.array(
  rentalLocationResponseSchema,
);

export type RentalLocationResponse = z.infer<
  typeof rentalLocationResponseSchema
>;
export type RentalLocationsResponse = z.infer<
  typeof rentalLocationsResponseSchema
>;
