export class BillingUnitInUseError extends Error {
  constructor() {
    super('One or more billing units are in use by a product type and cannot be removed');
  }
}
