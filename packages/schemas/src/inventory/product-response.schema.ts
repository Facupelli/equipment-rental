import z from "zod";

export const PricingTierResponseSchema = z.object({
  id: z.uuid(),
  fromUnit: z.number(),
  pricePerUnit: z.number(),
  currency: z.string().length(3),
});

export const ProductResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  trackingType: z.enum(["SERIALIZED", "BULK"]),
  attributes: z.record(z.string(), z.any()),
  pricingTiers: z.array(PricingTierResponseSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PricingTierResponseDto = z.infer<typeof PricingTierResponseSchema>;
export type ProductResponseDto = z.infer<typeof ProductResponseSchema>;
