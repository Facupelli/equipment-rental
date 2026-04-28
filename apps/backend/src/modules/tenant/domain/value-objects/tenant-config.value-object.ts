import { BookingMode, RoundingRule } from '@repo/types';
import {
  InvalidNewArrivalsWindowDaysException,
  InvalidDefaultCurrencyException,
  InvalidMaxOverRentThresholdException,
  InvalidInsuranceRatePercentException,
  InvalidBookingModeException,
} from '../exceptions/tenant.exceptions';
import { assertValidIanaTimezone } from '../utils/timezone.validation';

export type TenantNotificationChannel = 'EMAIL';

export interface TenantPricingConfigProps {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
  currency: string;
  locale: string;
  insuranceEnabled: boolean;
  insuranceRatePercent: number;
}

export interface TenantNotificationsConfigProps {
  enabledChannels: TenantNotificationChannel[];
}

export interface TenantConfigProps {
  pricing: TenantPricingConfigProps;
  notifications?: TenantNotificationsConfigProps;
  timezone: string;
  newArrivalsWindowDays: number;
  bookingMode?: BookingMode;
}

// Deep partial for merge — all fields optional at every level
export type TenantConfigPatch = {
  pricing?: Partial<TenantPricingConfigProps>;
  notifications?: Partial<TenantNotificationsConfigProps>;
  timezone?: string;
  newArrivalsWindowDays?: number;
  bookingMode?: BookingMode;
};

export class TenantConfig {
  public readonly pricing: Readonly<TenantPricingConfigProps>;
  public readonly notifications: Readonly<TenantNotificationsConfigProps>;
  public readonly timezone: string;
  public readonly newArrivalsWindowDays: number;
  public readonly bookingMode: BookingMode;

  private constructor(props: TenantConfigProps) {
    this.pricing = Object.freeze({ ...props.pricing });
    this.notifications = Object.freeze({ ...props.notifications! });
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
    TenantConfig.validateInsuranceRatePercent(normalizedProps.pricing.insuranceRatePercent);
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
        roundingRule: RoundingRule.IGNORE_PARTIAL_DAY,
        currency: 'ARS',
        locale: 'es-AR',
        insuranceEnabled: false,
        insuranceRatePercent: 0,
      },
      notifications: {
        enabledChannels: ['EMAIL'],
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
      notifications: {
        ...this.notifications,
        ...patch.notifications,
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
      notifications: { ...this.notifications },
    };
  }

  private static normalizeProps(props: TenantConfigProps): Required<TenantConfigProps> {
    return {
      ...props,
      pricing: { ...props.pricing },
      notifications: {
        enabledChannels: props.notifications?.enabledChannels ?? ['EMAIL'],
      },
      bookingMode: props.bookingMode ?? BookingMode.INSTANT_BOOK,
    };
  }

  // --- Validation helpers ---

  private static validateTimezone(timezone: string): void {
    assertValidIanaTimezone(timezone);
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

  private static validateInsuranceRatePercent(ratePercent: number): void {
    if (typeof ratePercent !== 'number' || ratePercent < 0 || ratePercent > 100) {
      throw new InvalidInsuranceRatePercentException(ratePercent);
    }
  }

  private static validateBookingMode(mode: BookingMode): void {
    if (mode !== BookingMode.INSTANT_BOOK && mode !== BookingMode.REQUEST_TO_BOOK) {
      throw new InvalidBookingModeException(mode);
    }
  }
}
