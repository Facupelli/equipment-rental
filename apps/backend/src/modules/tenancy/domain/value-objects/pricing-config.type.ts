import { RoundingRule } from '@repo/types';

// TODO create value object
export interface TenantConfig {
  pricing: TenantPricingConfig;
  timezone: string;
}

export interface TenantPricingConfig {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  defaultCurrency: string;
}
