export class NoPricingTierFoundException extends Error {
  constructor(units: number, entityId: string) {
    super(`No pricing tier found for ${units} units of ${entityId}.`);
    this.name = 'NoPricingTierFoundException';
  }
}
