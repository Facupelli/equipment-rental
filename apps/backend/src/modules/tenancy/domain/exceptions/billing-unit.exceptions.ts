export class InvalidBillingUnitDurationException extends Error {
  constructor() {
    super('Billing unit duration must be greater than 0.');
    this.name = 'InvalidBillingUnitDurationException';
  }
}

export class EmptyBillingUnitNameException extends Error {
  constructor() {
    super('Billing unit name cannot be empty.');
    this.name = 'EmptyBillingUnitNameException';
  }
}
