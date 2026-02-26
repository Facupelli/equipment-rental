import { RoundingRule } from '@repo/types';
import { CreateBillingUnitProps } from '../../domain/entities/billing-unit.entity';
import { TenantPricingConfig } from '../../domain/value-objects/pricing-config.type';

export const DEFAULT_PRICING_CONFIG: TenantPricingConfig = {
  overRentalEnabled: false,
  maxOverRentThreshold: 0,
  weekendCountsAsOne: false,
  roundingRule: RoundingRule.ROUND_UP,
  defaultCurrency: 'ARS',
};

export const DEFAULT_BILLING_UNITS_PROPS: Omit<CreateBillingUnitProps, 'tenantId'>[] = [
  { name: 'Hour', durationHours: 1, sortOrder: 30 },
  { name: 'Day', durationHours: 24, sortOrder: 20 },
  { name: 'Week', durationHours: 168, sortOrder: 10 },
];
