export class InvalidCouponDateRangeException extends Error {
  constructor() {
    super('validFrom must be strictly before validUntil');
    this.name = 'InvalidCouponDateRangeException';
  }
}

export class CouponUsageLimitException extends Error {
  constructor() {
    super('maxUsesPerCustomer cannot exceed maxUses');
    this.name = 'CouponUsageLimitException';
  }
}

export class RestrictedCouponMissingPerCustomerLimitException extends Error {
  constructor() {
    super('restrictedToCustomerId requires maxUsesPerCustomer to be set');
    this.name = 'RestrictedCouponMissingPerCustomerLimitException';
  }
}
