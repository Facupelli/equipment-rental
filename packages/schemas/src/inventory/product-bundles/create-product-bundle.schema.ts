import { z } from "zod";

export const bundleComponentSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
});

export const bundlePricingTierSchema = z.object({
  billingUnitId: z.uuid(),
  fromUnit: z.number().positive("fromUnit must be positive."),
  pricePerUnit: z.number().nonnegative("pricePerUnit must be non-negative."),
  currency: z
    .string()
    .regex(
      /^[A-Z]{3}$/,
      "currency must be a valid ISO 4217 code (3 uppercase letters).",
    ),
});

export const productBundleSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." })
    .max(255, { message: "Name cannot exceed 255 characters." }),
  description: z.string().trim().max(1000).optional(),
});

export const createProductBundleSchema = productBundleSchema.extend({
  baseTier: bundlePricingTierSchema,
  components: z
    .array(bundleComponentSchema)
    .min(1, "A bundle must have at least one component.")
    .refine(
      (components) =>
        new Set(components.map((c) => c.productId)).size === components.length,
      { message: "A bundle cannot contain duplicate products." },
    ),
});

export type BundleComponentDto = z.infer<typeof bundleComponentSchema>;
export type BundlePricingTierDto = z.infer<typeof bundlePricingTierSchema>;
export type CreateProductBundleDto = z.infer<typeof createProductBundleSchema>;
