import { Result } from "../../../../shared/domain/result";
import { ValueObject } from "../../../../shared/domain/value-object";

interface TimeRangeProps {
  start: Date;
  end: Date;
}

export class TimeRange extends ValueObject<TimeRangeProps> {
  private constructor(props: TimeRangeProps) {
    super(props);
  }

  public static create(start: Date, end: Date): Result<TimeRange> {
    if (end <= start) {
      return Result.fail("End date must be after start date");
    }

    if (start < new Date()) {
      return Result.fail("Start date cannot be in the past");
    }

    return Result.ok(new TimeRange({ start, end }));
  }

  public get start(): Date {
    return this.props.start;
  }

  public get end(): Date {
    return this.props.end;
  }

  public isValid(): boolean {
    return this.props.end > this.props.start;
  }

  public getDurationInHours(): number {
    const diffMs = this.props.end.getTime() - this.props.start.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  public getDurationInDays(): number {
    return this.getDurationInHours() / 24;
  }

  public overlaps(other: TimeRange): boolean {
    return this.props.start < other.end && this.props.end > other.start;
  }

  public contains(date: Date): boolean {
    return date >= this.props.start && date < this.props.end;
  }

  public getAffectedDates(): Date[] {
    const dates: Date[] = [];
    const current = new Date(this.props.start);
    current.setHours(0, 0, 0, 0); // Start of day

    while (current <= this.props.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
