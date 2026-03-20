import { CouponValidationFailureReason } from '../services/coupon-validation';

export class CouponNotFoundException extends Error {
  constructor(code: string) {
    super(`Coupon "${code}" not found.`);
    this.name = 'CouponNotFoundException';
  }
}

export class CouponValidationException extends Error {
  constructor(public readonly reason: CouponValidationFailureReason) {
    super(`Coupon validation failed: ${reason}`);
    this.name = 'CouponValidationException';
  }
}

export class CouponCodeAlreadyExistsException extends Error {
  constructor(code: string) {
    super(`Coupon with code "${code}" already exists for this tenant.`);
    this.name = 'CouponCodeAlreadyExistsException';
  }
}

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
