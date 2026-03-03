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

  durationInDays(): number {
    const ms = this.end.getTime() - this.start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  toString(): string {
    return `[${this.start.toISOString()}, ${this.end.toISOString()})`;
  }
}
