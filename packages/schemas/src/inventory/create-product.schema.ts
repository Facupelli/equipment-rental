import { z } from "zod";
import { TrackingType } from "@repo/types";
import { createPricingTierSchema } from "./create-pricing-tier.schema";

export const productSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(255, { message: "Name cannot exceed 255 characters" }),
  trackingType: z.enum(TrackingType),

  // JSONB field: flexible object structure
  attributes: z.record(z.string(), z.string()).default({}),
});

export const createProductSchema = productSchema.extend({
  pricingTiers: z
    .array(createPricingTierSchema)
    .min(1, "At least one pricing tier is required"),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
