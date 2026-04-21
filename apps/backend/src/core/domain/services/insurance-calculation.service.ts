import Decimal from 'decimal.js';

export interface InsuranceTerms {
  insuranceSelected: boolean;
  insuranceRatePercent: number;
}

export interface TenantInsuranceConfig {
  insuranceEnabled: boolean;
  insuranceRatePercent: number;
}

export interface InsuranceCalculationResult {
  insuranceApplied: boolean;
  insuranceAmount: Decimal;
  insuranceRatePercent: number;
}

export class InsuranceCalculationService {
  static resolveTerms(config: TenantInsuranceConfig, insuranceSelected: boolean): InsuranceTerms {
    if (!config.insuranceEnabled) {
      return {
        insuranceSelected: false,
        insuranceRatePercent: 0,
      };
    }

    return {
      insuranceSelected,
      insuranceRatePercent: config.insuranceRatePercent,
    };
  }

  static calculate(subtotalBeforeDiscounts: Decimal.Value, terms: InsuranceTerms): InsuranceCalculationResult {
    const insuranceApplied = terms.insuranceSelected;
    const insuranceAmount = insuranceApplied
      ? new Decimal(subtotalBeforeDiscounts).mul(terms.insuranceRatePercent).div(100)
      : new Decimal(0);

    return {
      insuranceApplied,
      insuranceAmount,
      insuranceRatePercent: terms.insuranceRatePercent,
    };
  }
}
