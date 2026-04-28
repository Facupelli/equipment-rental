import { DomainError } from 'src/core/exceptions/domain.error';

export class LocationError extends DomainError {}

export class LocationNotFoundError extends LocationError {
  constructor(locationId: string) {
    super(`Location '${locationId}' was not found`);
  }
}

export class LocationScheduleNotFoundError extends LocationError {
  constructor(scheduleId: string) {
    super(`Location schedule '${scheduleId}' was not found`);
  }
}
