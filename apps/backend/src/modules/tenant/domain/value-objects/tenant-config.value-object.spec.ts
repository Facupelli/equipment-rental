import { RoundingRule } from '@repo/types';

import { InvalidBookingModeException, InvalidInsuranceRatePercentException } from '../exceptions/tenant.exceptions';
import { TenantConfig } from './tenant-config.value-object';

describe('TenantConfig', () => {
  it('defaults bookingMode to instant-book', () => {
    const config = TenantConfig.default();

    expect(config.bookingMode).toBe('instant-book');
    expect(config.toPlainObject().bookingMode).toBe('instant-book');
    expect(config.pricing.insuranceEnabled).toBe(false);
    expect(config.pricing.insuranceRatePercent).toBe(0);
  });

  it('rejects invalid bookingMode values', () => {
    expect(() =>
      TenantConfig.create({
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
        timezone: 'UTC',
        newArrivalsWindowDays: 30,
        bookingMode: 'invalid-mode' as never,
      }),
    ).toThrow(InvalidBookingModeException);
  });

  it('normalizes legacy configs without bookingMode on reconstitution', () => {
    const config = TenantConfig.reconstitute({
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
      timezone: 'UTC',
      newArrivalsWindowDays: 30,
    });

    expect(config.bookingMode).toBe('instant-book');
    expect(config.pricing.insuranceEnabled).toBe(false);
    expect(config.pricing.insuranceRatePercent).toBe(0);
  });

  it('keeps the configured daily billing behavior during reconstitution', () => {
    const config = TenantConfig.reconstitute({
      pricing: {
        overRentalEnabled: false,
        maxOverRentThreshold: 0,
        weekendCountsAsOne: false,
        roundingRule: RoundingRule.BILL_OVER_HALF_DAY,
        currency: 'ARS',
        locale: 'es-AR',
        insuranceEnabled: false,
        insuranceRatePercent: 0,
      },
      timezone: 'UTC',
      newArrivalsWindowDays: 30,
    });

    expect(config.pricing.roundingRule).toBe(RoundingRule.BILL_OVER_HALF_DAY);
  });

  it('rejects insurance rates above 100 percent', () => {
    expect(() =>
      TenantConfig.create({
        pricing: {
          overRentalEnabled: false,
          maxOverRentThreshold: 0,
          weekendCountsAsOne: false,
          roundingRule: RoundingRule.IGNORE_PARTIAL_DAY,
          currency: 'ARS',
          locale: 'es-AR',
          insuranceEnabled: true,
          insuranceRatePercent: 101,
        },
        timezone: 'UTC',
        newArrivalsWindowDays: 30,
        bookingMode: 'instant-book',
      }),
    ).toThrow(InvalidInsuranceRatePercentException);
  });
});
