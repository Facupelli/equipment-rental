import { PricingRuleEffectType } from '@repo/types';
import { Money } from 'src/core/domain/value-objects/money.value-object';

export enum PricingAdjustmentSourceKind {
  LEGACY_PRICING_RULE = 'LEGACY_PRICING_RULE',
  LONG_RENTAL_DISCOUNT = 'LONG_RENTAL_DISCOUNT',
  PROMOTION = 'PROMOTION',
}

export type PricingTargetExclusions = {
  productTypeIds: string[];
  bundleIds: string[];
};

export type PricingAdjustment = {
  sourceKind: PricingAdjustmentSourceKind;
  sourceId: string;
  label: string;
  effectType: PricingRuleEffectType;
  configuredValue: number;
  discountAmount: Money;
};

export type PricingTargetContext = {
  productTypeId?: string;
  bundleId?: string;
};
