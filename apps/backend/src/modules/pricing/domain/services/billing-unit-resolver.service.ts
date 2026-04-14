import { RoundingRule } from '@repo/types';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

export type ResolveBillingUnitsInput = {
  period: DateRange;
  billingUnitDurationMinutes: number;
  tenantTimezone: string;
  weekendCountsAsOne: boolean;
  roundingRule: RoundingRule;
};

const MINUTES_PER_DAY = 24 * 60;

export class BillingUnitResolverService {
  resolveUnits(input: ResolveBillingUnitsInput): number {
    if (input.billingUnitDurationMinutes !== MINUTES_PER_DAY) {
      return Math.ceil(input.period.durationInMinutes() / input.billingUnitDurationMinutes);
    }

    const baseUnits = this.resolveDailyUnits(input.period, input.roundingRule);

    if (!input.weekendCountsAsOne) {
      return baseUnits;
    }

    return this.applyWeekendCollapse(baseUnits, input.period, input.tenantTimezone);
  }

  private resolveDailyUnits(period: DateRange, roundingRule: RoundingRule): number {
    const durationInMinutes = period.durationInMinutes();
    if (durationInMinutes === 0) {
      return 0;
    }

    const fullUnits = Math.floor(durationInMinutes / MINUTES_PER_DAY);
    const remainderMinutes = durationInMinutes % MINUTES_PER_DAY;

    if (remainderMinutes === 0) {
      return fullUnits;
    }

    if (roundingRule === RoundingRule.BILL_PARTIAL_AS_FULL_UNIT) {
      return fullUnits + 1;
    }

    return Math.max(1, fullUnits);
  }

  private applyWeekendCollapse(baseUnits: number, period: DateRange, timezone: string): number {
    if (baseUnits === 0) {
      return 0;
    }

    const occupiedDates = this.listOccupiedLocalDates(period, timezone);
    let collapsedWeekendPairs = 0;

    for (let index = 0; index < occupiedDates.length; index += 1) {
      const current = occupiedDates[index];
      const next = occupiedDates[index + 1];

      if (this.isSaturday(current) && next !== undefined && this.isSunday(next)) {
        collapsedWeekendPairs += 1;
        index += 1;
      }
    }

    return Math.max(1, baseUnits - collapsedWeekendPairs);
  }

  private listOccupiedLocalDates(period: DateRange, timezone: string): string[] {
    const startDate = this.toLocalDateKey(period.start, timezone);

    // Day billing treats the return date as exclusive in the tenant's local
    // calendar, so a Friday -> Monday rental occupies Friday, Saturday, Sunday.
    const endDateExclusive = this.toLocalDateKey(period.end, timezone);

    if (startDate === endDateExclusive) {
      return [startDate];
    }

    const dates: string[] = [];
    let cursor = startDate;

    while (cursor < endDateExclusive) {
      dates.push(cursor);
      cursor = this.nextDateKey(cursor);
    }

    return dates;
  }

  private toLocalDateKey(date: Date, timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private nextDateKey(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

    return this.toUtcDateKey(nextDate);
  }

  private toUtcDateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isSaturday(dateKey: string): boolean {
    return this.dayOfWeek(dateKey) === 6;
  }

  private isSunday(dateKey: string): boolean {
    return this.dayOfWeek(dateKey) === 0;
  }

  private dayOfWeek(dateKey: string): number {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }
}
