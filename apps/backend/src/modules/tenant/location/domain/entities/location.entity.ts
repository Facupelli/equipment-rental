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
    private name: string,
    private address: string | null,
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

  getName(): string {
    return this.name;
  }

  getAddress(): string | null {
    return this.address;
  }

  getSchedules(): readonly LocationSchedule[] {
    return this.schedules;
  }

  // --- Commands ---

  deactivate(): void {
    this.isActive = false;
  }

  update(props: { name?: string; address?: string | null }): void {
    if (props.name !== undefined) {
      const normalizedName = props.name.trim();

      if (normalizedName.length === 0) {
        throw new InvalidLocationNameException();
      }

      this.name = normalizedName;
    }

    if (props.address !== undefined) {
      this.address = props.address?.trim() ?? null;
    }
  }

  addSchedules(items: CreateLocationScheduleProps[]): void {
    const candidates = items.map((props) => LocationSchedule.create(props));

    // Check candidates against existing schedules
    for (const candidate of candidates) {
      if (this.schedules.some((existing) => existing.conflictsWith(candidate))) {
        throw new LocationScheduleOverlapException();
      }
    }

    // Check candidates against each other within the batch
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        if (candidates[i].conflictsWith(candidates[j])) {
          throw new LocationScheduleOverlapException();
        }
      }
    }

    this.schedules.push(...candidates);
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
