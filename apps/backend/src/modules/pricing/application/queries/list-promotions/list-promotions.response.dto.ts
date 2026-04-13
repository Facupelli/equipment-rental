import { PricingRuleEffectType } from '@repo/types';
import { z } from 'zod';
import { PromotionType } from '../../../domain/types/promotion.types';

const SeasonalConditionSchema = z.object({
  type: z.literal(PromotionType.SEASONAL),
  dateFrom: z.string(),
  dateTo: z.string(),
});

const CouponConditionSchema = z.object({
  type: z.literal(PromotionType.COUPON),
});

const CustomerSpecificConditionSchema = z.object({
  type: z.literal(PromotionType.CUSTOMER_SPECIFIC),
  customerId: z.string().uuid(),
});

const PromotionConditionViewSchema = z.discriminatedUnion('type', [
  SeasonalConditionSchema,
  CouponConditionSchema,
  CustomerSpecificConditionSchema,
]);

const PercentageEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.PERCENTAGE),
  value: z.number(),
});

const FlatEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.FLAT),
  value: z.number(),
});

const PromotionEffectViewSchema = z.discriminatedUnion('type', [PercentageEffectSchema, FlatEffectSchema]);

const PromotionViewSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.nativeEnum(PromotionType),
  priority: z.number().int(),
  stackable: z.boolean(),
  isActive: z.boolean(),
  condition: PromotionConditionViewSchema,
  effect: PromotionEffectViewSchema,
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

export const ListPromotionsResponseSchema = z.object({
  data: z.array(PromotionViewSchema),
  meta: PaginatedMetaSchema,
});

export type PromotionView = z.infer<typeof PromotionViewSchema>;
export type ListPromotionsResponseDto = z.infer<typeof ListPromotionsResponseSchema>;
