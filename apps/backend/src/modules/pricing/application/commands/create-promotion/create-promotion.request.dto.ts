import { PricingRuleEffectType } from '@repo/types';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PromotionType } from '../../../domain/types/promotion.types';

const PromotionTargetSchema = z.object({
  excludedProductTypeIds: z.array(z.string().uuid()).default([]),
  excludedBundleIds: z.array(z.string().uuid()).default([]),
});

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

const PromotionConditionSchema = z.discriminatedUnion('type', [
  SeasonalConditionSchema,
  CouponConditionSchema,
  CustomerSpecificConditionSchema,
]);

const PercentageEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.PERCENTAGE),
  value: z.coerce.number().min(0),
});

const FlatEffectSchema = z.object({
  type: z.literal(PricingRuleEffectType.FLAT),
  value: z.coerce.number().min(0),
});

const PromotionEffectSchema = z.discriminatedUnion('type', [PercentageEffectSchema, FlatEffectSchema]);

export const CreatePromotionSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PromotionType),
  priority: z.coerce.number().int().min(0),
  stackable: z.boolean(),
  condition: PromotionConditionSchema,
  effect: PromotionEffectSchema,
  target: PromotionTargetSchema.optional(),
});

export class CreatePromotionRequestDto extends createZodDto(CreatePromotionSchema) {}
