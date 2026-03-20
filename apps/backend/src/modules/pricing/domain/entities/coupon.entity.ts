import { randomUUID } from 'crypto';

import {
  InvalidCouponDateRangeException,
  CouponUsageLimitException,
  RestrictedCouponMissingPerCustomerLimitException,
} from '../exceptions/coupon.exceptions';

export interface CreateCouponProps {
  tenantId: string;
  pricingRuleId: string;
  code: string;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  restrictedToCustomerId?: string;
  validFrom?: Date;
  validUntil?: Date;
}

export interface ReconstituteCouponProps {
  id: string;
  tenantId: string;
  pricingRuleId: string;
  code: string;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  restrictedToCustomerId: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
}

export class Coupon {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly pricingRuleId: string,
    public readonly code: string,
    public readonly maxUses: number | null,
    public readonly maxUsesPerCustomer: number | null,
    public readonly restrictedToCustomerId: string | null,
    public readonly validFrom: Date | null,
    public readonly validUntil: Date | null,
    private _isActive: boolean,
  ) {}

  static create(props: CreateCouponProps): Coupon {
    if (props.validFrom && props.validUntil && props.validFrom >= props.validUntil) {
      throw new InvalidCouponDateRangeException();
    }

    if (props.maxUses && props.maxUsesPerCustomer && props.maxUsesPerCustomer > props.maxUses) {
      throw new CouponUsageLimitException();
    }

    if (props.restrictedToCustomerId && !props.maxUsesPerCustomer) {
      throw new RestrictedCouponMissingPerCustomerLimitException();
    }

    return new Coupon(
      randomUUID(),
      props.tenantId,
      props.pricingRuleId,
      props.code.trim().toUpperCase(),
      props.maxUses ?? null,
      props.maxUsesPerCustomer ?? null,
      props.restrictedToCustomerId ?? null,
      props.validFrom ?? null,
      props.validUntil ?? null,
      true,
    );
  }

  static reconstitute(props: ReconstituteCouponProps): Coupon {
    return new Coupon(
      props.id,
      props.tenantId,
      props.pricingRuleId,
      props.code,
      props.maxUses,
      props.maxUsesPerCustomer,
      props.restrictedToCustomerId,
      props.validFrom,
      props.validUntil,
      props.isActive,
    );
  }

  get isActive(): boolean {
    return this._isActive;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  // ── Validation methods ──────────────────────────────────────────────────

  /**
   * Checks the active flag and the validity window.
   * Both must pass — an active coupon outside its window is still invalid.
   */
  isValidAt(now: Date): boolean {
    if (!this._isActive) return false;
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validUntil && now > this.validUntil) return false;
    return true;
  }

  /**
   * Checks whether the coupon can be used by the given customer.
   * - No restriction: anyone can use it, including guests.
   * - Restricted: only the specific customer matches.
   *   A guest (undefined) never matches a restricted coupon.
   */
  canBeUsedBy(customerId: string | undefined): boolean {
    if (!this.restrictedToCustomerId) return true;
    return this.restrictedToCustomerId === customerId;
  }

  /**
   * Null maxUses means unlimited — always passes.
   * Receives the count of active (non-voided) redemptions from the caller.
   */
  isWithinGlobalLimit(totalActiveRedemptions: number): boolean {
    if (this.maxUses === null) return true;
    return totalActiveRedemptions < this.maxUses;
  }

  /**
   * Null maxUsesPerCustomer means unlimited per customer — always passes.
   * Guest orders (undefined customerId) skip this check entirely —
   * per-customer limits cannot be enforced without identity.
   */
  isWithinPerCustomerLimit(customerActiveRedemptions: number, customerId: string | undefined): boolean {
    if (customerId === undefined) return true;
    if (this.maxUsesPerCustomer === null) return true;
    return customerActiveRedemptions < this.maxUsesPerCustomer;
  }
}
