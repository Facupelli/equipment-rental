import { RoundingRule } from '@repo/types';
import { DEFAULT_CONFIG } from '../../infrastructure/config/tenancy.defaults';

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

export class TenantConfigValueObject {
  constructor(public readonly value: TenantConfig = DEFAULT_CONFIG) {}

  static create(config: TenantConfig = DEFAULT_CONFIG): TenantConfigValueObject {
    // Add any validation for config structure if needed
    return new TenantConfigValueObject(config);
  }
}
