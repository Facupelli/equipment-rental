import {
  PromotionAdjustmentType,
  PromotionActivationType,
  PromotionApplicabilityTarget,
  PromotionConditionType,
  PromotionEffectType,
  PromotionStackingType,
} from '@repo/types';

export type BookingWindowPromotionCondition = {
  type: PromotionConditionType.BOOKING_WINDOW;
  from: string;
  to: string;
};

export type RentalWindowPromotionCondition = {
  type: PromotionConditionType.RENTAL_WINDOW;
  from: string;
  to: string;
};

export type CustomerIdInPromotionCondition = {
  type: PromotionConditionType.CUSTOMER_ID_IN;
  customerIds: string[];
};

export type MinSubtotalPromotionCondition = {
  type: PromotionConditionType.MIN_SUBTOTAL;
  amount: number;
  currency: string;
};

export type RentalDurationMinPromotionCondition = {
  type: PromotionConditionType.RENTAL_DURATION_MIN;
  minUnits: number;
};

export type CategoryItemQuantityPromotionCondition = {
  type: PromotionConditionType.CATEGORY_ITEM_QUANTITY;
  categoryId: string;
  minQuantity: number;
};

export type DistinctCategoriesWithMinQuantityPromotionCondition = {
  type: PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY;
  categoryIds: string[];
  minCategoriesMatched: number;
  minQuantityPerCategory: number;
};

export type PromotionCondition =
  | BookingWindowPromotionCondition
  | RentalWindowPromotionCondition
  | CustomerIdInPromotionCondition
  | MinSubtotalPromotionCondition
  | RentalDurationMinPromotionCondition
  | CategoryItemQuantityPromotionCondition
  | DistinctCategoriesWithMinQuantityPromotionCondition;

export type PercentOffPromotionEffect = {
  type: PromotionEffectType.PERCENT_OFF;
  percentage: number;
};

export type LongRentalTieredPercentOffPromotionEffect = {
  type: PromotionEffectType.LONG_RENTAL_TIERED_PERCENT_OFF;
  tiers: Array<{
    fromUnits: number;
    toUnits: number | null;
    percentage: number;
  }>;
};

export type PromotionEffect = PercentOffPromotionEffect | LongRentalTieredPercentOffPromotionEffect;

export type PromotionApplicability = {
  appliesTo: PromotionApplicabilityTarget[];
  excludedProductTypeIds: string[];
  excludedBundleIds: string[];
};

export type PromotionAdjustmentDescriptor = {
  configuredValue: number;
  effectType: PromotionAdjustmentType.PERCENTAGE;
};

export { PromotionActivationType, PromotionApplicabilityTarget, PromotionStackingType };
