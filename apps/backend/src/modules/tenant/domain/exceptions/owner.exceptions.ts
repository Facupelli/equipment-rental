export class InvalidOwnerNameException extends Error {
  constructor() {
    super('Owner name cannot be empty.');
    this.name = 'InvalidOwnerNameException';
  }
}
