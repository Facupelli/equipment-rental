import { randomUUID } from 'crypto';
import { ScheduleSlotType } from '@repo/types';
import {
  InvalidScheduleDayOfWeekException,
  InvalidScheduleDaySpecificationException,
} from '../exceptions/location-schedule.exceptions';
import { ScheduleWindow, ScheduleWindowProps } from '../value-objects/location-schedule-window.value-object';

export interface CreateLocationScheduleProps {
  locationId: string;
  type: ScheduleSlotType;
  dayOfWeek: number | null;
  specificDate: Date | null;
  window: ScheduleWindowProps;
}

export interface ReconstituteLocationScheduleProps {
  id: string;
  locationId: string;
  type: ScheduleSlotType;
  dayOfWeek: number | null;
  specificDate: Date | null;
  window: ScheduleWindowProps;
}

export class LocationSchedule {
  private constructor(
    public readonly id: string,
    public readonly locationId: string,
    public readonly type: ScheduleSlotType,
    public readonly dayOfWeek: number | null,
    public readonly specificDate: Date | null,
    private window: ScheduleWindow,
  ) {}

  static create(props: CreateLocationScheduleProps): LocationSchedule {
    LocationSchedule.validateDaySpecification(props.dayOfWeek, props.specificDate);
    if (props.dayOfWeek !== null) {
      LocationSchedule.validateDayOfWeek(props.dayOfWeek);
    }

    return new LocationSchedule(
      randomUUID(),
      props.locationId,
      props.type,
      props.dayOfWeek,
      props.specificDate,
      new ScheduleWindow(props.window),
    );
  }

  static reconstitute(props: ReconstituteLocationScheduleProps): LocationSchedule {
    return new LocationSchedule(
      props.id,
      props.locationId,
      props.type,
      props.dayOfWeek,
      props.specificDate,
      new ScheduleWindow(props.window),
    );
  }

  // --- Queries ---

  getWindow(): ScheduleWindow {
    return this.window;
  }

  isRecurring(): boolean {
    return this.dayOfWeek !== null;
  }

  isOverride(): boolean {
    return this.specificDate !== null;
  }

  conflictsWith(other: LocationSchedule): boolean {
    // Different types never conflict
    if (this.type !== other.type) return false;

    // Different tiers never conflict — override and recurring coexist
    if (this.isRecurring() !== other.isRecurring()) return false;

    // Same tier: check key match then window overlap
    if (this.isRecurring() && this.dayOfWeek !== other.dayOfWeek) return false;
    if (this.isOverride() && !this.isSameDate(other.specificDate!)) return false;

    return this.window.overlapsWith(other.getWindow());
  }

  generateSlots(): number[] {
    return this.window.generateSlots();
  }

  // --- Commands ---

  updateWindow(props: ScheduleWindowProps): void {
    this.window = new ScheduleWindow(props);
  }

  // --- Private helpers ---

  private isSameDate(other: Date): boolean {
    return (
      this.specificDate!.getFullYear() === other.getFullYear() &&
      this.specificDate!.getMonth() === other.getMonth() &&
      this.specificDate!.getDate() === other.getDate()
    );
  }

  private static validateDaySpecification(dayOfWeek: number | null, specificDate: Date | null): void {
    const hasDayOfWeek = dayOfWeek !== null;
    const hasSpecificDate = specificDate !== null;

    if (hasDayOfWeek === hasSpecificDate) {
      throw new InvalidScheduleDaySpecificationException();
    }
  }

  private static validateDayOfWeek(day: number): void {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new InvalidScheduleDayOfWeekException(day);
    }
  }
}
