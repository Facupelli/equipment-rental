import { z } from "zod";

export const createPricingTierSchema = z.object({
  locationId: z.uuid().nullable(),
  fromUnit: z.number().int().nonnegative(),
  toUnit: z.number().int().positive().nullable(),
  pricePerUnit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
});

export const updatePricingTierSchema = z.object({
  locationId: z.uuid().nullable().optional(),
  fromUnit: z.number().int().nonnegative().optional(),
  toUnit: z.number().int().positive().nullable().optional(),
  pricePerUnit: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
    .optional(),
});

export type CreatePricingTierDto = z.infer<typeof createPricingTierSchema>;
export type UpdatePricingTierDto = z.infer<typeof updatePricingTierSchema>;
