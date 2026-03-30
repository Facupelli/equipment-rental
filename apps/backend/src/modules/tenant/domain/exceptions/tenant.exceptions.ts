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

export class InvalidTimezoneException extends Error {
  constructor(timezone: string) {
    super(`"${timezone}" is not a valid IANA timezone`);
  }
}

export class InvalidNewArrivalsWindowDaysException extends Error {
  constructor(days: number) {
    super(`newArrivalsWindowDays must be a positive integer, got ${days}`);
  }
}

export class InvalidDefaultCurrencyException extends Error {
  constructor(currency: string) {
    super(`"${currency}" is not a valid ISO 4217 currency code (expected 3 uppercase letters)`);
  }
}

export class InvalidMaxOverRentThresholdException extends Error {
  constructor(threshold: number) {
    super(`maxOverRentThreshold must be a non-negative number, got ${threshold}`);
  }
}

export class InvalidBookingModeException extends Error {
  constructor(mode: string) {
    super(`bookingMode must be 'instant-book' or 'request-to-book', got ${mode}`);
  }
}
