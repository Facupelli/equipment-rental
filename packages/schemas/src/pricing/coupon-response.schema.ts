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

export const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).optional(),
});

export type ListCouponsQueryDto = z.infer<typeof listCouponsQuerySchema>;
