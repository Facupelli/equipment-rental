export class InvalidScheduleWindowTimeException extends Error {
  constructor(value: number) {
    super(`Schedule time must be an integer between 0 and 1439. Got: ${value}`);
    this.name = 'InvalidScheduleWindowTimeException';
  }
}

export class InvalidScheduleWindowOrderException extends Error {
  constructor(open: number, close: number) {
    super(`openTime (${open}) must be strictly less than closeTime (${close})`);
    this.name = 'InvalidScheduleWindowOrderException';
  }
}

export class InvalidScheduleWindowIntervalException extends Error {
  constructor(interval: number) {
    super(`slotIntervalMinutes must be a positive integer. Got: ${interval}`);
    this.name = 'InvalidScheduleWindowIntervalException';
  }
}

export class InvalidScheduleDaySpecificationException extends Error {
  constructor() {
    super('Exactly one of dayOfWeek or specificDate must be set.');
    this.name = 'InvalidScheduleDaySpecificationException';
  }
}

export class InvalidScheduleDayOfWeekException extends Error {
  constructor(day: number) {
    super(`dayOfWeek must be an integer between 0 and 6. Got: ${day}`);
    this.name = 'InvalidScheduleDayOfWeekException';
  }
}

export class LocationScheduleOverlapException extends Error {
  constructor() {
    super('The schedule window overlaps with an existing schedule for the same location, day and type.');
    this.name = 'LocationScheduleOverlapException';
  }
}
