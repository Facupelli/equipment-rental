import { z } from "zod";
import { TrackingType } from "@repo/types";
import { createPricingTierSchema } from "./create-pricing-tier.schema";

export const IncludedItemSchema = z.object({
  name: z.string().trim().min(1, "Included item name cannot be empty."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  notes: z.string().trim().optional(),
});

/**
 * Reflects the full product model shape.
 * locationId and totalStock are optional here — the cross-field rule
 * is enforced at the create level via discriminatedUnion.
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." })
    .max(255, { message: "Name cannot exceed 255 characters." }),
  categoryId: z.uuid().optional(),
  trackingType: z.enum(TrackingType),
  locationId: z.uuid().optional(),
  totalStock: z.number().int().positive().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  includedItems: z.array(IncludedItemSchema).default([]),
});

const baseTierField = {
  baseTier: createPricingTierSchema,
};

/**
 * BULK: locationId and totalStock are required.
 * SERIALIZED: locationId and totalStock must not be present.
 */
export const createProductSchema = z.discriminatedUnion("trackingType", [
  productSchema.extend({
    trackingType: z.literal(TrackingType.BULK),
    locationId: z.uuid({
      message: "BULK products require a valid locationId.",
    }),
    totalStock: z
      .number()
      .int()
      .positive({ message: "BULK products require a positive totalStock." }),
    ...baseTierField,
  }),
  productSchema.extend({
    trackingType: z.literal(TrackingType.SERIALIZED),
    locationId: z
      .never({ message: "SERIALIZED products cannot have a locationId." })
      .optional(),
    totalStock: z
      .never({ message: "SERIALIZED products cannot have a totalStock." })
      .optional(),
    ...baseTierField,
  }),
]);

export type IncludedItemDto = z.infer<typeof IncludedItemSchema>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
