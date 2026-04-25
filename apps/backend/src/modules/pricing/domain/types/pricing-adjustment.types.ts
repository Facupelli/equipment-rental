import { PricingAdjustmentSourceKind, PromotionAdjustmentType } from '@repo/types';
import { Money } from 'src/core/domain/value-objects/money.value-object';

export type PricingTargetExclusions = {
  productTypeIds: string[];
  bundleIds: string[];
};

export type PricingAdjustment = {
  sourceKind: PricingAdjustmentSourceKind;
  sourceId: string;
  label: string;
  effectType: PromotionAdjustmentType;
  configuredValue: number;
  discountAmount: Money;
};

export type PricingTargetContext = {
  productTypeId?: string;
  bundleId?: string;
};
