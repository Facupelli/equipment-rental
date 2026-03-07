import { z } from "zod";

export const createPricingTierSchema = z
  .object({
    locationId: z.uuid().nullable().default(null),
    fromUnit: z.int().positive(),
    toUnit: z.int().positive().nullable().default(null),
    pricePerUnit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  })
  .refine((data) => data.toUnit === null || data.toUnit > data.fromUnit, {
    message: "toUnit must be greater than fromUnit",
    path: ["toUnit"],
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
