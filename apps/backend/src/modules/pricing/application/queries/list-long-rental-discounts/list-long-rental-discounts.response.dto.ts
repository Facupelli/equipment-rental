import { z } from 'zod';

const LongRentalDiscountTierViewSchema = z.object({
  fromUnits: z.number().int(),
  toUnits: z.number().int().nullable(),
  discountPct: z.number(),
});

const LongRentalDiscountViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  priority: z.number().int(),
  isActive: z.boolean(),
  tiers: z.array(LongRentalDiscountTierViewSchema),
  excludedProductTypeIds: z.array(z.string().uuid()),
  excludedBundleIds: z.array(z.string().uuid()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const PaginatedMetaSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const ListLongRentalDiscountsResponseSchema = z.object({
  data: z.array(LongRentalDiscountViewSchema),
  meta: PaginatedMetaSchema,
});

export type LongRentalDiscountView = z.infer<typeof LongRentalDiscountViewSchema>;
export type ListLongRentalDiscountsResponseDto = z.infer<typeof ListLongRentalDiscountsResponseSchema>;
