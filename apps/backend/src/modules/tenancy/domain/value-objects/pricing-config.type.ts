import { RoundingRule } from '@repo/types';

// TODO create value object
export interface TenantPricingConfig {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  defaultCurrency: string;
}
