import {
  InvalidScheduleWindowIntervalException,
  InvalidScheduleWindowOrderException,
  InvalidScheduleWindowTimeException,
} from '../exceptions/location-schedule.exceptions';

export interface ScheduleWindowProps {
  openTime: number;
  closeTime: number;
  slotIntervalMinutes: number;
}

export class ScheduleWindow {
  public readonly openTime: number;
  public readonly closeTime: number;
  public readonly slotIntervalMinutes: number;

  constructor(props: ScheduleWindowProps) {
    ScheduleWindow.validateTime(props.openTime);
    ScheduleWindow.validateTime(props.closeTime);
    ScheduleWindow.validateOrder(props.openTime, props.closeTime);
    ScheduleWindow.validateInterval(props.slotIntervalMinutes);

    this.openTime = props.openTime;
    this.closeTime = props.closeTime;
    this.slotIntervalMinutes = props.slotIntervalMinutes;
  }

  generateSlots(): number[] {
    const slots: number[] = [];
    for (let t = this.openTime; t < this.closeTime; t += this.slotIntervalMinutes) {
      slots.push(t);
    }
    return slots;
  }

  overlapsWith(other: ScheduleWindow): boolean {
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
    if (openTime >= closeTime) {
      throw new InvalidScheduleWindowOrderException(openTime, closeTime);
    }
  }

  private static validateInterval(interval: number): void {
    if (!Number.isInteger(interval) || interval <= 0) {
      throw new InvalidScheduleWindowIntervalException(interval);
    }
  }
}
