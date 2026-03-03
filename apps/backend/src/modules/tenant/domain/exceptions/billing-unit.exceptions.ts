export class InvalidBillingUnitLabelException extends Error {
  constructor() {
    super('Billing unit label cannot be empty.');
    this.name = 'InvalidBillingUnitLabelException';
  }
}

export class InvalidBillingUnitDurationException extends Error {
  constructor() {
    super('Billing unit duration must be greater than zero.');
    this.name = 'InvalidBillingUnitDurationException';
  }
}
