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

export type CreatePricingTierDto = z.infer<typeof createPricingTierSchema>;

export const setPricingTiersBodySchema = z.object({
  targetType: z.enum(["PRODUCT_TYPE", "BUNDLE"]),
  targetId: z.uuid(),
  tiers: z.array(createPricingTierSchema),
});

export type SetPricingTiersDto = z.infer<typeof setPricingTiersBodySchema>;
