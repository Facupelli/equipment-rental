import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { BillingUnitResolverService } from './billing-unit-resolver.service';

describe('BillingUnitResolverService', () => {
  let resolver: BillingUnitResolverService;

  beforeEach(() => {
    resolver = new BillingUnitResolverService();
  });

  it('keeps partial-unit ceiling behavior for non-day billing units', () => {
    const units = resolver.resolveUnits({
      period: DateRange.create(new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T11:30:00Z')),
      billingUnitDurationMinutes: 60,
      tenantTimezone: 'UTC',
      weekendCountsAsOne: true,
    });

    expect(units).toBe(2);
  });

  it('keeps default day billing when the weekend rule is disabled', () => {
    const units = resolver.resolveUnits({
      period: DateRange.create(new Date('2025-01-03T13:00:00Z'), new Date('2025-01-06T13:00:00Z')),
      billingUnitDurationMinutes: 1440,
      tenantTimezone: 'America/Argentina/Buenos_Aires',
      weekendCountsAsOne: false,
    });

    expect(units).toBe(3);
  });

  it('counts friday to monday as two day units when the full weekend is occupied', () => {
    const units = resolver.resolveUnits({
      period: DateRange.create(new Date('2025-01-03T13:00:00Z'), new Date('2025-01-06T13:00:00Z')),
      billingUnitDurationMinutes: 1440,
      tenantTimezone: 'America/Argentina/Buenos_Aires',
      weekendCountsAsOne: true,
    });

    expect(units).toBe(2);
  });

  it('counts saturday to sunday as one day because only saturday is occupied', () => {
    const units = resolver.resolveUnits({
      period: DateRange.create(new Date('2025-01-04T13:00:00Z'), new Date('2025-01-05T13:00:00Z')),
      billingUnitDurationMinutes: 1440,
      tenantTimezone: 'America/Argentina/Buenos_Aires',
      weekendCountsAsOne: true,
    });

    expect(units).toBe(1);
  });

  it('counts saturday to monday as one day when both weekend days are occupied', () => {
    const units = resolver.resolveUnits({
      period: DateRange.create(new Date('2025-01-04T13:00:00Z'), new Date('2025-01-06T13:00:00Z')),
      billingUnitDurationMinutes: 1440,
      tenantTimezone: 'America/Argentina/Buenos_Aires',
      weekendCountsAsOne: true,
    });

    expect(units).toBe(1);
  });

  it('uses tenant-local dates instead of UTC day boundaries', () => {
    const units = resolver.resolveUnits({
      period: DateRange.create(new Date('2025-01-04T02:30:00Z'), new Date('2025-01-06T12:00:00Z')),
      billingUnitDurationMinutes: 1440,
      tenantTimezone: 'America/Argentina/Buenos_Aires',
      weekendCountsAsOne: true,
    });

    expect(units).toBe(2);
  });
});
