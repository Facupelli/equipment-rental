import {
  InvalidScheduleWindowInvariantException,
  InvalidScheduleWindowOrderException,
  InvalidScheduleWindowTimeException,
} from '../exceptions/location-schedule.exceptions';

export interface ScheduleWindowProps {
  openTime: number;
  closeTime: number;
  slotIntervalMinutes: number | null;
}

export class ScheduleWindow {
  public readonly openTime: number;
  public readonly closeTime: number;
  public readonly slotIntervalMinutes: number | null;

  constructor(props: ScheduleWindowProps) {
    ScheduleWindow.validateTime(props.openTime);
    ScheduleWindow.validateTime(props.closeTime);
    ScheduleWindow.validateOrder(props.openTime, props.closeTime);
    ScheduleWindow.validateInvariant(props.openTime, props.closeTime, props.slotIntervalMinutes);

    this.openTime = props.openTime;
    this.closeTime = props.closeTime;
    this.slotIntervalMinutes = props.slotIntervalMinutes;
  }

  isFixedHour(): boolean {
    return this.openTime === this.closeTime;
  }

  generateSlots(): number[] {
    if (this.isFixedHour()) {
      return [this.openTime];
    }

    const slots: number[] = [];
    for (let t = this.openTime; t < this.closeTime; t += this.slotIntervalMinutes!) {
      slots.push(t);
    }
    return slots;
  }

  overlapsWith(other: ScheduleWindow): boolean {
    const thisFixed = this.isFixedHour();
    const otherFixed = other.isFixedHour();

    if (thisFixed && otherFixed) {
      return this.openTime === other.openTime;
    }

    if (thisFixed) {
      return this.openTime >= other.openTime && this.openTime < other.closeTime;
    }

    if (otherFixed) {
      return other.openTime >= this.openTime && other.openTime < this.closeTime;
    }

    return this.openTime < other.closeTime && this.closeTime > other.openTime;
  }

  equals(other: ScheduleWindow): boolean {
    return (
      this.openTime === other.openTime &&
      this.closeTime === other.closeTime &&
      this.slotIntervalMinutes === other.slotIntervalMinutes
    );
  }

  private static validateTime(value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > 1439) {
      throw new InvalidScheduleWindowTimeException(value);
    }
  }

  private static validateOrder(openTime: number, closeTime: number): void {
    if (openTime > closeTime) {
      throw new InvalidScheduleWindowOrderException(openTime, closeTime);
    }
  }

  private static validateInvariant(openTime: number, closeTime: number, slotIntervalMinutes: number | null): void {
    const isFixedHour = openTime === closeTime;
    const hasInterval = slotIntervalMinutes !== null;

    if (isFixedHour === hasInterval) {
      throw new InvalidScheduleWindowInvariantException();
    }
  }
}
