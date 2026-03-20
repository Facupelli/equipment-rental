import { z } from "zod";

export const couponViewSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  pricingRuleName: z.string(),
  maxUses: z.number().int().positive().nullable(),
  maxUsesPerCustomer: z.number().int().positive().nullable(),
  totalRedemptions: z.number().int(),
  validFrom: z.coerce.date().nullable(),
  validUntil: z.coerce.date().nullable(),
  isActive: z.boolean(),
});

export type CouponView = z.infer<typeof couponViewSchema>;
