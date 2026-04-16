import { randomUUID } from 'crypto';

import {
  InvalidCouponDateRangeException,
  CouponUsageLimitException,
  RestrictedCouponMissingPerCustomerLimitException,
} from '../exceptions/coupon.exceptions';

export interface CreateCouponProps {
  tenantId: string;
  promotionId: string;
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
  promotionId: string;
  code: string;
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
  restrictedToCustomerId: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
}

export interface UpdateCouponProps {
  promotionId: string;
  code: string;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  restrictedToCustomerId?: string;
  validFrom?: Date;
  validUntil?: Date;
}

export class Coupon {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private _promotionId: string,
    private _code: string,
    private _maxUses: number | null,
    private _maxUsesPerCustomer: number | null,
    private _restrictedToCustomerId: string | null,
    private _validFrom: Date | null,
    private _validUntil: Date | null,
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
      props.promotionId,
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
      props.promotionId,
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

  get promotionId(): string {
    return this._promotionId;
  }

  get code(): string {
    return this._code;
  }

  get maxUses(): number | null {
    return this._maxUses;
  }

  get maxUsesPerCustomer(): number | null {
    return this._maxUsesPerCustomer;
  }

  get restrictedToCustomerId(): string | null {
    return this._restrictedToCustomerId;
  }

  get validFrom(): Date | null {
    return this._validFrom;
  }

  get validUntil(): Date | null {
    return this._validUntil;
  }

  update(props: UpdateCouponProps): void {
    if (props.validFrom && props.validUntil && props.validFrom >= props.validUntil) {
      throw new InvalidCouponDateRangeException();
    }

    if (props.maxUses && props.maxUsesPerCustomer && props.maxUsesPerCustomer > props.maxUses) {
      throw new CouponUsageLimitException();
    }

    if (props.restrictedToCustomerId && !props.maxUsesPerCustomer) {
      throw new RestrictedCouponMissingPerCustomerLimitException();
    }

    this._promotionId = props.promotionId;
    this._code = props.code.trim().toUpperCase();
    this._maxUses = props.maxUses ?? null;
    this._maxUsesPerCustomer = props.maxUsesPerCustomer ?? null;
    this._restrictedToCustomerId = props.restrictedToCustomerId ?? null;
    this._validFrom = props.validFrom ?? null;
    this._validUntil = props.validUntil ?? null;
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
    if (this._validFrom && now < this._validFrom) return false;
    if (this._validUntil && now > this._validUntil) return false;
    return true;
  }

  /**
   * Checks whether the coupon can be used by the given customer.
   * - No restriction: anyone can use it, including guests.
   * - Restricted: only the specific customer matches.
   *   A guest (undefined) never matches a restricted coupon.
   */
  canBeUsedBy(customerId: string | undefined): boolean {
    if (!this._restrictedToCustomerId) return true;
    return this._restrictedToCustomerId === customerId;
  }

  /**
   * Null maxUses means unlimited — always passes.
   * Receives the count of active (non-voided) redemptions from the caller.
   */
  isWithinGlobalLimit(totalActiveRedemptions: number): boolean {
    if (this._maxUses === null) return true;
    return totalActiveRedemptions < this._maxUses;
  }

  /**
   * Null maxUsesPerCustomer means unlimited per customer — always passes.
   * Guest orders (undefined customerId) skip this check entirely —
   * per-customer limits cannot be enforced without identity.
   */
  isWithinPerCustomerLimit(customerActiveRedemptions: number, customerId: string | undefined): boolean {
    if (customerId === undefined) return true;
    if (this._maxUsesPerCustomer === null) return true;
    return customerActiveRedemptions < this._maxUsesPerCustomer;
  }
}
