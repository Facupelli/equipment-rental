export class InvalidPricingRulePriorityException extends Error {
  constructor() {
    super('Pricing rule priority must be zero or greater.');
    this.name = 'InvalidPricingRulePriorityException';
  }
}

export class PricingRuleNotFoundException extends Error {
  constructor(id: string) {
    super(`Pricing rule "${id}" not found.`);
    this.name = 'PricingRuleNotFoundException';
  }
}

export class InvalidCouponPricingRuleTypeException extends Error {
  constructor(id: string) {
    super(`Pricing rule "${id}" is not of type COUPON.`);
    this.name = 'InvalidCouponPricingRuleTypeException';
  }
}
