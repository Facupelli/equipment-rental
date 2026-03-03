export class InvalidLocationNameException extends Error {
  constructor() {
    super('Location name cannot be empty.');
    this.name = 'InvalidLocationNameException';
  }
}
