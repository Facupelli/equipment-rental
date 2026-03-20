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
