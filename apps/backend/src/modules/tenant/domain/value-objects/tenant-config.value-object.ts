import { BookingMode, RoundingRule } from '@repo/types';
import {
  InvalidTimezoneException,
  InvalidNewArrivalsWindowDaysException,
  InvalidDefaultCurrencyException,
  InvalidMaxOverRentThresholdException,
  InvalidBookingModeException,
} from '../exceptions/tenant.exceptions';

export interface TenantPricingConfigProps {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  currency: string;
  locale: string;
}

export interface TenantConfigProps {
  pricing: TenantPricingConfigProps;
  timezone: string;
  newArrivalsWindowDays: number;
  bookingMode?: BookingMode;
}

type LegacyRoundingRule = 'ROUND_UP' | 'SPLIT';

// Deep partial for merge — all fields optional at every level
export type TenantConfigPatch = {
  pricing?: Partial<TenantPricingConfigProps>;
  timezone?: string;
  newArrivalsWindowDays?: number;
  bookingMode?: BookingMode;
};

export class TenantConfig {
  public readonly pricing: Readonly<TenantPricingConfigProps>;
  public readonly timezone: string;
  public readonly newArrivalsWindowDays: number;
  public readonly bookingMode: BookingMode;

  private constructor(props: TenantConfigProps) {
    this.pricing = Object.freeze({ ...props.pricing });
    this.timezone = props.timezone;
    this.newArrivalsWindowDays = props.newArrivalsWindowDays;
    this.bookingMode = props.bookingMode!;
  }

  // --- Factory (validates all inputs) ---

  static create(props: TenantConfigProps): TenantConfig {
    const normalizedProps = TenantConfig.normalizeProps(props);

    TenantConfig.validateTimezone(normalizedProps.timezone);
    TenantConfig.validateNewArrivalsWindowDays(normalizedProps.newArrivalsWindowDays);
    TenantConfig.validateDefaultCurrency(normalizedProps.pricing.currency);
    TenantConfig.validateMaxOverRentThreshold(normalizedProps.pricing.maxOverRentThreshold);
    TenantConfig.validateBookingMode(normalizedProps.bookingMode);

    return new TenantConfig(normalizedProps);
  }

  // --- Reconstitute (skips validation — data is trusted from DB) ---

  static reconstitute(props: TenantConfigProps): TenantConfig {
    return new TenantConfig(TenantConfig.normalizeProps(props));
  }

  static default(): TenantConfig {
    return TenantConfig.create({
      pricing: {
        overRentalEnabled: false,
        maxOverRentThreshold: 0,
        weekendCountsAsOne: false,
        roundingRule: RoundingRule.IGNORE_PARTIAL_UNIT,
        currency: 'ARS',
        locale: 'es-AR',
      },
      timezone: 'UTC',
      newArrivalsWindowDays: 30,
      bookingMode: BookingMode.INSTANT_BOOK,
    });
  }

  // --- Merge (returns a new VO with patched values, re-validates) ---

  merge(patch: TenantConfigPatch): TenantConfig {
    return TenantConfig.create({
      timezone: patch.timezone ?? this.timezone,
      newArrivalsWindowDays: patch.newArrivalsWindowDays ?? this.newArrivalsWindowDays,
      bookingMode: patch.bookingMode ?? this.bookingMode,
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
      bookingMode: this.bookingMode,
      pricing: { ...this.pricing },
    };
  }

  private static normalizeProps(props: TenantConfigProps): Required<TenantConfigProps> {
    return {
      ...props,
      pricing: {
        ...props.pricing,
        roundingRule: TenantConfig.normalizeRoundingRule(props.pricing.roundingRule),
      },
      bookingMode: props.bookingMode ?? BookingMode.INSTANT_BOOK,
    };
  }

  private static normalizeRoundingRule(rule: RoundingRule | LegacyRoundingRule): RoundingRule {
    if (rule === 'ROUND_UP') {
      return RoundingRule.BILL_PARTIAL_AS_FULL_UNIT;
    }

    if (rule === 'SPLIT') {
      return RoundingRule.IGNORE_PARTIAL_UNIT;
    }

    return rule;
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

  private static validateBookingMode(mode: BookingMode): void {
    if (mode !== BookingMode.INSTANT_BOOK && mode !== BookingMode.REQUEST_TO_BOOK) {
      throw new InvalidBookingModeException(mode);
    }
  }
}
