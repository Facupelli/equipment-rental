import { RoundingRule } from '@repo/types';

export abstract class TenantConfigPort {
  /**
   * Returns the pricing inputs required by PricingEngine.
   * Includes TenantPricingConfig and all configured BillingUnits.
   * Returns null if the tenant does not exist.
   */
  abstract findPricingInputs(tenantId: string): Promise<RentalTenancyPricingView | null>;
}

export interface RentalTenancyPricingView {
  pricingConfig: TenantPricingConfigView;
  billingUnits: BillingUnitView[];
}

export interface TenantPricingConfigView {
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  defaultCurrency: string;
}

export interface BillingUnitView {
  id: string;
  name: string;
  durationHours: number;

  /** Higher = larger unit. Drives greedy decomposition order in PricingEngine. */
  sortOrder: number;
}
