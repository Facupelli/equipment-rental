export class InvalidPricingRulePriorityException extends Error {
  constructor() {
    super('Pricing rule priority must be zero or greater.');
    this.name = 'InvalidPricingRulePriorityException';
  }
}
