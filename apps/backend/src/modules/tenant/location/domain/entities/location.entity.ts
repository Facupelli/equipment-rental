import { randomUUID } from 'crypto';
import { assertValidIanaTimezone } from 'src/modules/tenant/domain/utils/timezone.validation';
import { InvalidLocationNameException } from '../exceptions/location.exceptions';
import { LocationScheduleOverlapException } from '../exceptions/location-schedule.exceptions';
import { LocationSchedule, CreateLocationScheduleProps } from './location-schedule.entity';

export interface CreateLocationProps {
  tenantId: string;
  name: string;
  address: string | null;
  timezone: string | null;
  supportsDelivery: boolean;
  deliveryDefaults: {
    country: string | null;
    stateRegion: string | null;
    city: string | null;
    postalCode: string | null;
  };
}

export interface ReconstituteLocationProps {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  timezone: string | null;
  isActive: boolean;
  supportsDelivery: boolean;
  deliveryDefaults: {
    country: string | null;
    stateRegion: string | null;
    city: string | null;
    postalCode: string | null;
  };
  schedules: LocationSchedule[];
}

export class Location {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private name: string,
    private address: string | null,
    private timezone: string | null,
    private isActive: boolean,
    private supportsDelivery: boolean,
    private deliveryDefaultCountry: string | null,
    private deliveryDefaultStateRegion: string | null,
    private deliveryDefaultCity: string | null,
    private deliveryDefaultPostalCode: string | null,
    private schedules: LocationSchedule[],
  ) {}

  static create(props: CreateLocationProps): Location {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidLocationNameException();
    }

    Location.validateTimezone(props.timezone);

    const defaults = Location.normalizeDeliveryDefaults(props.deliveryDefaults);

    return new Location(
      randomUUID(),
      props.tenantId,
      props.name.trim(),
      props.address?.trim() ?? null,
      props.timezone,
      true,
      props.supportsDelivery,
      defaults.country,
      defaults.stateRegion,
      defaults.city,
      defaults.postalCode,
      [],
    );
  }

  static reconstitute(props: ReconstituteLocationProps): Location {
    const defaults = Location.normalizeDeliveryDefaults(props.deliveryDefaults);

    return new Location(
      props.id,
      props.tenantId,
      props.name,
      props.address,
      props.timezone,
      props.isActive,
      props.supportsDelivery,
      defaults.country,
      defaults.stateRegion,
      defaults.city,
      defaults.postalCode,
      props.schedules,
    );
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

  getTimezone(): string | null {
    return this.timezone;
  }

  getSchedules(): readonly LocationSchedule[] {
    return this.schedules;
  }

  get supportsDeliveryEnabled(): boolean {
    return this.supportsDelivery;
  }

  getDeliveryDefaults(): {
    country: string | null;
    stateRegion: string | null;
    city: string | null;
    postalCode: string | null;
  } {
    return {
      country: this.deliveryDefaultCountry,
      stateRegion: this.deliveryDefaultStateRegion,
      city: this.deliveryDefaultCity,
      postalCode: this.deliveryDefaultPostalCode,
    };
  }

  // --- Commands ---

  deactivate(): void {
    this.isActive = false;
  }

  update(props: {
    name?: string;
    address?: string | null;
    timezone?: string | null;
    supportsDelivery?: boolean;
    deliveryDefaults?: {
      country: string | null;
      stateRegion: string | null;
      city: string | null;
      postalCode: string | null;
    };
  }): void {
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

    if (props.timezone !== undefined) {
      Location.validateTimezone(props.timezone);
      this.timezone = props.timezone;
    }

    if (props.supportsDelivery !== undefined) {
      this.supportsDelivery = props.supportsDelivery;
    }

    if (props.deliveryDefaults !== undefined) {
      const defaults = Location.normalizeDeliveryDefaults(props.deliveryDefaults);
      this.deliveryDefaultCountry = defaults.country;
      this.deliveryDefaultStateRegion = defaults.stateRegion;
      this.deliveryDefaultCity = defaults.city;
      this.deliveryDefaultPostalCode = defaults.postalCode;
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
    props: { openTime: number; closeTime: number; slotIntervalMinutes: number | null },
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

  private static normalizeDeliveryDefaults(props: {
    country: string | null;
    stateRegion: string | null;
    city: string | null;
    postalCode: string | null;
  }): {
    country: string | null;
    stateRegion: string | null;
    city: string | null;
    postalCode: string | null;
  } {
    return {
      country: props.country?.trim() || null,
      stateRegion: props.stateRegion?.trim() || null,
      city: props.city?.trim() || null,
      postalCode: props.postalCode?.trim() || null,
    };
  }

  private static validateTimezone(timezone: string | null): void {
    if (timezone === null) {
      return;
    }

    assertValidIanaTimezone(timezone);
  }
}
