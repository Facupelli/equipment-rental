import { RoundingRule } from '@repo/types';
import {
  InvalidTimezoneException,
  InvalidNewArrivalsWindowDaysException,
  InvalidDefaultCurrencyException,
  InvalidMaxOverRentThresholdException,
} from '../exceptions/tenant.exceptions';

export interface TenantPricingConfigProps {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  defaultCurrency: string;
}

export interface TenantConfigProps {
  pricing: TenantPricingConfigProps;
  timezone: string;
  newArrivalsWindowDays: number;
}

// Deep partial for merge — all fields optional at every level
export type TenantConfigPatch = {
  pricing?: Partial<TenantPricingConfigProps>;
  timezone?: string;
  newArrivalsWindowDays?: number;
};

export class TenantConfig {
  public readonly pricing: Readonly<TenantPricingConfigProps>;
  public readonly timezone: string;
  public readonly newArrivalsWindowDays: number;

  private constructor(props: TenantConfigProps) {
    this.pricing = Object.freeze({ ...props.pricing });
    this.timezone = props.timezone;
    this.newArrivalsWindowDays = props.newArrivalsWindowDays;
  }

  // --- Factory (validates all inputs) ---

  static create(props: TenantConfigProps): TenantConfig {
    TenantConfig.validateTimezone(props.timezone);
    TenantConfig.validateNewArrivalsWindowDays(props.newArrivalsWindowDays);
    TenantConfig.validateDefaultCurrency(props.pricing.defaultCurrency);
    TenantConfig.validateMaxOverRentThreshold(props.pricing.maxOverRentThreshold);
    return new TenantConfig(props);
  }

  // --- Reconstitute (skips validation — data is trusted from DB) ---

  static reconstitute(props: TenantConfigProps): TenantConfig {
    return new TenantConfig(props);
  }

  static default(): TenantConfig {
    return TenantConfig.create({
      pricing: {
        overRentalEnabled: false,
        maxOverRentThreshold: 0,
        weekendCountsAsOne: false,
        roundingRule: RoundingRule.ROUND_UP,
        defaultCurrency: 'ARS',
      },
      timezone: 'UTC',
      newArrivalsWindowDays: 30,
    });
  }

  // --- Merge (returns a new VO with patched values, re-validates) ---

  merge(patch: TenantConfigPatch): TenantConfig {
    return TenantConfig.create({
      timezone: patch.timezone ?? this.timezone,
      newArrivalsWindowDays: patch.newArrivalsWindowDays ?? this.newArrivalsWindowDays,
      pricing: {
        ...this.pricing,
        ...patch.pricing,
      },
    });
  }

  // --- Serialization ---

  toPlainObject(): TenantConfigProps {
    return {
      timezone: this.timezone,
      newArrivalsWindowDays: this.newArrivalsWindowDays,
      pricing: { ...this.pricing },
    };
  }

  // --- Validation helpers ---

  private static validateTimezone(timezone: string): void {
    if (timezone === 'UTC') {
      return;
    }

    const valid = Intl.supportedValuesOf('timeZone');
    if (!valid.includes(timezone)) {
      throw new InvalidTimezoneException(timezone);
    }
  }

  private static validateNewArrivalsWindowDays(days: number): void {
    if (!Number.isInteger(days) || days <= 0) {
      throw new InvalidNewArrivalsWindowDaysException(days);
    }
  }

  private static validateDefaultCurrency(currency: string): void {
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new InvalidDefaultCurrencyException(currency);
    }
  }

  private static validateMaxOverRentThreshold(threshold: number): void {
    if (typeof threshold !== 'number' || threshold < 0) {
      throw new InvalidMaxOverRentThresholdException(threshold);
    }
  }
}
