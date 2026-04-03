import { z } from "zod";

export const rentalLocationResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string().nullable(),
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
