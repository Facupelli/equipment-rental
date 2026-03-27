import { InvalidDateRangeException } from '../../exceptions/invalid-date-range.exception';

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

  private static localSlotToUtc(date: Date, minutesFromMidnight: number, timezone: string): Date {
    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const get = (type: string) => Number(dateParts.find((p) => p.type === type)?.value ?? '0');
    const year = get('year');
    const month = get('month');
    const day = get('day');

    const hours = Math.floor(minutesFromMidnight / 60);
    const minutes = minutesFromMidnight % 60;

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const min = String(minutes).padStart(2, '0');
    const utcCandidate = new Date(`${year}-${mm}-${dd}T${hh}:${min}:00Z`);

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
    const localMonth = getT('month') - 1;
    const localDay = getT('day');
    const localHour = getT('hour') === 24 ? 0 : getT('hour');
    const localMinute = getT('minute');

    const localAsUtcMs = Date.UTC(localYear, localMonth, localDay, localHour, localMinute);
    const targetMs = Date.UTC(year, month - 1, day, hours, minutes);
    const offsetMs = localAsUtcMs - utcCandidate.getTime();

    return new Date(targetMs - offsetMs);
  }

  overlaps(other: DateRange): boolean {
    return this.start < other.end && other.start < this.end;
  }

  contains(date: Date): boolean {
    return date >= this.start && date < this.end;
  }

  equals(other: DateRange): boolean {
    return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
  }

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
