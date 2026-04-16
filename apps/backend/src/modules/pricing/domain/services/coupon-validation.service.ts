import { Coupon } from '../entities/coupon.entity';

export type CouponValidationFailureReason =
  | 'INACTIVE'
  | 'NOT_YET_VALID'
  | 'EXPIRED'
  | 'CUSTOMER_RESTRICTED'
  | 'MAX_USES_REACHED'
  | 'MAX_USES_PER_CUSTOMER_REACHED';

export type CouponValidationResult =
  | { valid: true; promotionId: string }
  | { valid: false; reason: CouponValidationFailureReason };

export type CouponValidationInput = {
  coupon: Coupon;
  now: Date;
  customerId: string | undefined;
  totalActiveRedemptions: number;
  customerActiveRedemptions: number;
};

/**
 * Validates a coupon against all access control constraints in order
 * of cheapest-to-most-expensive check. Returns the first failure found
 * or a valid result carrying the promotionId to inject into context.
 */
export class CouponValidationService {
  validate(input: CouponValidationInput): CouponValidationResult {
    const { coupon, now, customerId, totalActiveRedemptions, customerActiveRedemptions } = input;

    // ── 1. Active flag ────────────────────────────────────────────────────
    if (!coupon.isActive) {
      return { valid: false, reason: 'INACTIVE' };
    }

    // ── 2. Validity window ────────────────────────────────────────────────
    // Split into two distinct reasons so callers can surface meaningful
    // messages: "this code isn't active yet" vs "this code has expired".
    if (coupon.validFrom && now < coupon.validFrom) {
      return { valid: false, reason: 'NOT_YET_VALID' };
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return { valid: false, reason: 'EXPIRED' };
    }

    // ── 3. Customer restriction ───────────────────────────────────────────
    // Guest (undefined) attempting a customer-restricted coupon fails here.
    if (!coupon.canBeUsedBy(customerId)) {
      return { valid: false, reason: 'CUSTOMER_RESTRICTED' };
    }

    // ── 4. Global usage limit ─────────────────────────────────────────────
    if (!coupon.isWithinGlobalLimit(totalActiveRedemptions)) {
      return { valid: false, reason: 'MAX_USES_REACHED' };
    }

    // ── 5. Per-customer usage limit ───────────────────────────────────────
    // Guest orders always pass — isWithinPerCustomerLimit handles that internally.
    if (!coupon.isWithinPerCustomerLimit(customerActiveRedemptions, customerId)) {
      return { valid: false, reason: 'MAX_USES_PER_CUSTOMER_REACHED' };
    }

    return { valid: true, promotionId: coupon.promotionId };
  }
}
