export class InvalidLocationNameException extends Error {
  constructor() {
    super('Location name cannot be empty.');
    this.name = 'InvalidLocationNameException';
  }
}

export class LocationNotFoundError extends Error {
  constructor(id: string) {
    super(`Location not found: ${id}`);
    this.name = 'LocationNotFoundError';
  }
}
