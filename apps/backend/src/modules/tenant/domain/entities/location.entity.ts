import { randomUUID } from 'crypto';
import { InvalidLocationNameException } from '../exceptions/location.exceptions';
import { LocationScheduleOverlapException } from '../exceptions/location-schedule.exceptions';
import { LocationSchedule, CreateLocationScheduleProps } from './location-schedule.entity';

export interface CreateLocationProps {
  tenantId: string;
  name: string;
  address: string | null;
}

export interface ReconstituteLocationProps {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  isActive: boolean;
  schedules: LocationSchedule[];
}

export class Location {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly address: string | null,
    private isActive: boolean,
    private schedules: LocationSchedule[],
  ) {}

  static create(props: CreateLocationProps): Location {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidLocationNameException();
    }
    return new Location(randomUUID(), props.tenantId, props.name.trim(), props.address?.trim() ?? null, true, []);
  }

  static reconstitute(props: ReconstituteLocationProps): Location {
    return new Location(props.id, props.tenantId, props.name, props.address, props.isActive, props.schedules);
  }

  // --- Queries ---

  get active(): boolean {
    return this.isActive;
  }

  getSchedules(): readonly LocationSchedule[] {
    return this.schedules;
  }

  // --- Commands ---

  deactivate(): void {
    this.isActive = false;
  }

  addSchedule(props: CreateLocationScheduleProps): void {
    const candidate = LocationSchedule.create(props);

    const hasConflict = this.schedules.some((existing) => existing.conflictsWith(candidate));

    if (hasConflict) {
      throw new LocationScheduleOverlapException();
    }

    this.schedules.push(candidate);
  }

  removeSchedule(scheduleId: string): void {
    this.schedules = this.schedules.filter((s) => s.id !== scheduleId);
  }

  updateScheduleWindow(
    scheduleId: string,
    props: { openTime: number; closeTime: number; slotIntervalMinutes: number },
  ): void {
    const target = this.schedules.find((s) => s.id === scheduleId);
    if (!target) {
      return;
    }

    const tempCandidate = LocationSchedule.reconstitute({
      id: scheduleId,
      locationId: this.id,
      type: target.type,
      dayOfWeek: target.dayOfWeek,
      specificDate: target.specificDate,
      window: props,
    });

    const windowConflict = this.schedules
      .filter((s) => s.id !== scheduleId)
      .some((existing) => existing.conflictsWith(tempCandidate));

    if (windowConflict) {
      throw new LocationScheduleOverlapException();
    }

    target.updateWindow(props);
  }
}
