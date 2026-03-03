export class InvalidDateRangeException extends Error {
  constructor(start: Date, end: Date) {
    super(`Invalid date range: start (${start.toISOString()}) must be before end (${end.toISOString()}).`);
    this.name = 'InvalidDateRangeException';
  }
}
