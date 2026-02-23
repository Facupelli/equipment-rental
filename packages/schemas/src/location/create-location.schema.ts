import { z } from "zod";

const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const AddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
  coordinates: CoordinatesSchema.optional(),
});

export const CreateLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: AddressSchema,
  isActive: z.boolean().optional().default(true),
});

export type CreateLocationDto = z.infer<typeof CreateLocationSchema>;
