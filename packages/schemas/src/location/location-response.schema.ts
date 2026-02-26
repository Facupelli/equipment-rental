import z from "zod";

export const CoordinatesResponseSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const AddressResponseSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  coordinates: CoordinatesResponseSchema.optional(),
});

export const LocationResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: AddressResponseSchema,
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CoordinatesResponseDto = z.infer<typeof CoordinatesResponseSchema>;
export type AddressResponseDto = z.infer<typeof AddressResponseSchema>;
export type LocationResponseDto = z.infer<typeof LocationResponseSchema>;
