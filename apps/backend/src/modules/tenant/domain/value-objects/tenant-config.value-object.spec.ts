import { RoundingRule } from '@repo/types';

import { InvalidBookingModeException } from '../exceptions/tenant.exceptions';
import { TenantConfig } from './tenant-config.value-object';

describe('TenantConfig', () => {
  it('defaults bookingMode to instant-book', () => {
    const config = TenantConfig.default();

    expect(config.bookingMode).toBe('instant-book');
    expect(config.toPlainObject().bookingMode).toBe('instant-book');
  });

  it('rejects invalid bookingMode values', () => {
    expect(() =>
      TenantConfig.create({
        pricing: {
          overRentalEnabled: false,
          maxOverRentThreshold: 0,
          weekendCountsAsOne: false,
          roundingRule: RoundingRule.ROUND_UP,
          currency: 'ARS',
          locale: 'es-AR',
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
        roundingRule: RoundingRule.ROUND_UP,
        currency: 'ARS',
        locale: 'es-AR',
      },
      timezone: 'UTC',
      newArrivalsWindowDays: 30,
    });

    expect(config.bookingMode).toBe('instant-book');
  });
});
