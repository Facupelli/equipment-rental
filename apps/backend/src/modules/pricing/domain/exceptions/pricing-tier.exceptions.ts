export class DuplicatePricingTierException extends Error {
  constructor(fromUnit: number, locationId: string | null) {
    super(
      `A pricing tier starting at unit ${fromUnit} already exists${locationId ? ` for location ${locationId}` : ' (global)'}`,
    );
  }
}

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

export class OverlappingPricingTierException extends Error {
  constructor() {
    super('Pricing tiers have overlapping unit ranges for the same location');
  }
}
