import { RoundingRule } from '../entities/billing-unit.entity';

// TODO create value object
export interface TenantPricingConfig {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  defaultCurrency: string;
}
