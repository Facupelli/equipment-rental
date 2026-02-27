import { z } from "zod";
import { TrackingType } from "@repo/types";
import { createPricingTierSchema } from "./create-pricing-tier.schema";

export const IncludedItemSchema = z.object({
  name: z.string().trim().min(1, "Included item name cannot be empty."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  notes: z.string().trim().optional(),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(255, { message: "Name cannot exceed 255 characters" }),
  categoryId: z.uuid().optional(),
  trackingType: z.enum(TrackingType),

  // JSONB field: flexible object structure
  attributes: z.record(z.string(), z.string()).default({}),
  includedItems: z.array(IncludedItemSchema).default([]),
});

export const createProductSchema = productSchema.extend({
  pricingTiers: z
    .array(createPricingTierSchema)
    .min(1, "At least one pricing tier is required"),
});

export type IncludedItemDto = z.infer<typeof IncludedItemSchema>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
