import { PricingRuleEffectType, PromotionType } from '@repo/types';

export type SeasonalPromotionCondition = {
  type: PromotionType.SEASONAL;
  dateFrom: string;
  dateTo: string;
};

export type CouponPromotionCondition = {
  type: PromotionType.COUPON;
};

export type CustomerSpecificPromotionCondition = {
  type: PromotionType.CUSTOMER_SPECIFIC;
  customerId: string;
};

export type PromotionCondition =
  | SeasonalPromotionCondition
  | CouponPromotionCondition
  | CustomerSpecificPromotionCondition;

export type PercentagePromotionEffect = {
  type: PricingRuleEffectType.PERCENTAGE;
  value: number;
};

export type FlatPromotionEffect = {
  type: PricingRuleEffectType.FLAT;
  value: number;
};

export type PromotionEffect = PercentagePromotionEffect | FlatPromotionEffect;

export type PromotionTarget = {
  excludedProductTypeIds: string[];
  excludedBundleIds: string[];
};
