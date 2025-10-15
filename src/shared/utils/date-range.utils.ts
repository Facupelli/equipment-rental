export interface DateRange {
  start: Date;
  end: Date;
}

export class DateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateRangeError";
  }
}

/**
 * Validates a date range
 * @throws DateRangeError if validation fails
 */
export function validateDateRange(start: Date, end: Date): void {
  if (end <= start) {
    throw new DateRangeError("End date must be after start date");
  }

  if (start < new Date()) {
    throw new DateRangeError("Start date cannot be in the past");
  }
}

/**
 * Calculates duration in days between two dates
 */
export function getDurationInDays(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Calculates duration in hours between two dates
 */
export function getDurationInHours(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Checks if two date ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Checks if a date falls within a range
 */
export function dateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date < end;
}

/**
 * Gets all dates (days) affected by a date range
 */
export function getAffectedDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
