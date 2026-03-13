import { InvalidDateRangeException } from '../exceptions/date-range.exceptions';

/**
 * Encapsulates a time-bounded interval with an inclusive start and exclusive end,
 * mirroring PostgreSQL's default tstzrange semantics: [start, end).
 *
 * Being a Value Object, equality is determined by value — two DateRange instances
 * representing the same interval are considered identical regardless of reference.
 */
export class DateRange {
  readonly start: Date;
  readonly end: Date;

  private constructor(start: Date, end: Date) {
    this.start = start;
    this.end = end;
  }

  static create(start: Date, end: Date): DateRange {
    if (start >= end) {
      throw new InvalidDateRangeException(start, end);
    }
    return new DateRange(start, end);
  }

  /**
   * Derives a DateRange from local slot times, converting to UTC using the tenant's timezone.
   *
   * @param pickupDate  - Calendar date of pickup (time component is ignored)
   * @param pickupTime  - Pickup time as minutes from midnight (e.g. 540 = 09:00)
   * @param returnDate  - Calendar date of return (time component is ignored)
   * @param returnTime  - Return time as minutes from midnight (e.g. 1020 = 17:00)
   * @param timezone    - IANA timezone string from TenantConfig (e.g. "America/Argentina/Buenos_Aires")
   */
  static fromLocalSlots(
    pickupDate: Date,
    pickupTime: number,
    returnDate: Date,
    returnTime: number,
    timezone: string,
  ): DateRange {
    const start = DateRange.localSlotToUtc(pickupDate, pickupTime, timezone);
    const end = DateRange.localSlotToUtc(returnDate, returnTime, timezone);
    return DateRange.create(start, end);
  }

  /**
   * Converts a calendar date + minutes-from-midnight into a UTC Date,
   * interpreting the wall-clock time in the given IANA timezone.
   *
   * Date components are extracted in the tenant's timezone — not in UTC —
   * to avoid off-by-one-day errors for timezones east of UTC.
   */
  private static localSlotToUtc(date: Date, minutesFromMidnight: number, timezone: string): Date {
    // Extract the calendar date components as seen in the tenant's timezone.
    // Using Intl here is critical — JS Date getters (getFullYear etc.) return
    // UTC components, which can be a different calendar day for UTC+ timezones.
    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const get = (type: string) => Number(dateParts.find((p) => p.type === type)?.value ?? '0');
    const year = get('year');
    const month = get('month'); // 1-based
    const day = get('day');

    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = minutesFromMidnight % 60;

    // Reconstruct the wall-clock moment as an ISO string without timezone,
    // then treat it as UTC to get a candidate timestamp.
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const min = String(minutes).padStart(2, '0');
    const utcCandidate = new Date(`${year}-${mm}-${dd}T${hh}:${min}:00Z`);

    // Determine what local time this UTC candidate represents in the tenant's timezone,
    // then compute the offset and correct the candidate to the true UTC instant.
    const timeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(utcCandidate);

    const getT = (type: string) => Number(timeParts.find((p) => p.type === type)?.value ?? '0');
    const localYear = getT('year');
    const localMonth = getT('month') - 1; // 0-based for Date.UTC
    const localDay = getT('day');
    const localHour = getT('hour') === 24 ? 0 : getT('hour');
    const localMinute = getT('minute');

    const localAsUtcMs = Date.UTC(localYear, localMonth, localDay, localHour, localMinute);
    const targetMs = Date.UTC(year, month - 1, day, hours, minutes);
    const offsetMs = localAsUtcMs - utcCandidate.getTime();

    return new Date(targetMs - offsetMs);
  }

  /**
   * Checks whether this range overlaps with another.
   *
   * Two ranges overlap if one starts before the other ends, and vice versa.
   * This uses the standard half-open interval overlap formula:
   *   A overlaps B  ⟺  A.start < B.end  AND  B.start < A.end
   */
  overlaps(other: DateRange): boolean {
    return this.start < other.end && other.start < this.end;
  }

  /**
   * Checks whether a given point in time falls within this range.
   * Inclusive of start, exclusive of end — consistent with [start, end) semantics.
   */
  contains(date: Date): boolean {
    return date >= this.start && date < this.end;
  }

  /**
   * Value Object equality — two ranges are equal if their start and end match.
   */
  equals(other: DateRange): boolean {
    return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
  }

  /**
   * Total duration in whole minutes.
   * Used by PricingCalculator to derive billing units from a billing unit's durationMinutes.
   */
  durationInMinutes(): number {
    return (this.end.getTime() - this.start.getTime()) / (1000 * 60);
  }

  durationInDays(): number {
    const ms = this.end.getTime() - this.start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  toString(): string {
    return `[${this.start.toISOString()}, ${this.end.toISOString()})`;
  }
}
