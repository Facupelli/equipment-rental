export class InvalidTenantNameException extends Error {
  constructor() {
    super('Tenant name cannot be empty.');
    this.name = 'InvalidTenantNameException';
  }
}

export class InvalidTenantSlugException extends Error {
  constructor() {
    super('Tenant slug cannot be empty.');
    this.name = 'InvalidTenantSlugException';
  }
}

export class BillingUnitAlreadyActiveException extends Error {
  constructor(billingUnitId: string) {
    super(`Billing unit '${billingUnitId}' is already active for this tenant.`);
    this.name = 'BillingUnitAlreadyActiveException';
  }
}

export class BillingUnitNotActiveException extends Error {
  constructor(billingUnitId: string) {
    super(`Billing unit '${billingUnitId}' is not active for this tenant.`);
    this.name = 'BillingUnitNotActiveException';
  }
}
