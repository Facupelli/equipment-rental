export class InvalidPricingTierRangeException extends Error {
  constructor(reason: string) {
    super(`Invalid pricing tier range: ${reason}`);
    this.name = 'InvalidPricingTierRangeException';
  }
}

export class InvalidPricingTierPriceException extends Error {
  constructor() {
    super('Price per unit must be greater than zero.');
    this.name = 'InvalidPricingTierPriceException';
  }
}

export class DuplicatePricingTierException extends Error {
  constructor(fromUnit: number, locationId: string | null) {
    const scope = locationId ? `location '${locationId}'` : 'all locations';
    super(`A pricing tier starting at unit ${fromUnit} already exists for ${scope}.`);
    this.name = 'DuplicatePricingTierException';
  }
}

export class PricingTierNotFoundException extends Error {
  constructor(tierId: string) {
    super(`Pricing tier '${tierId}' not found.`);
    this.name = 'PricingTierNotFoundException';
  }
}

export class InvalidPricingTierParentException extends Error {
  constructor() {
    super('Pricing tier must be created with a bundle or product type.');
    this.name = 'InvalidPricingTierParentException';
  }
}
