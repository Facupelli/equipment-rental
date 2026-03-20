import { Injectable } from '@nestjs/common';
import { CouponValidationService } from '../domain/services/coupon-validation';
import { CouponRedemptionRepository } from '../infrastructure/repositories/coupon-redemption.repoistory';
import { CouponRepositoryPort, PrismaTransactionClient } from '../domain/ports/coupon.repository.port';
import { CouponNotFoundException, CouponValidationException } from '../domain/exceptions/coupon.exceptions';

export type ResolveCouponResult = {
  couponId: string;
  ruleId: string;
};

export type ResolveCouponInput = {
  tenantId: string;
  code: string;
  customerId: string | undefined;
  now: Date;
};

export type RedeemCouponInput = {
  couponId: string;
  orderId: string;
  customerId: string | undefined;
  now: Date;
};

@Injectable()
export class CouponApplicationService {
  private readonly validationService = new CouponValidationService();

  constructor(
    private readonly couponRepo: CouponRepositoryPort,
    private readonly redemptionRepo: CouponRedemptionRepository,
  ) {}

  // ── Resolve ───────────────────────────────────────────────────────────────

  /**
   * Soft validation pass — called before pricing, outside the transaction.
   * Gives the customer early feedback before we touch inventory or open a tx.
   *
   * Throws CouponNotFoundException or CouponValidationException on failure.
   * Returns couponId + ruleId to inject into the pricing context on success.
   */
  async resolveCouponForPricing(input: ResolveCouponInput): Promise<ResolveCouponResult> {
    const coupon = await this.couponRepo.loadByCode(input.tenantId, input.code);

    if (!coupon) {
      throw new CouponNotFoundException(input.code);
    }

    // Fetch both counts in parallel — both are needed for full validation.
    const [totalActiveRedemptions, customerActiveRedemptions] = await Promise.all([
      this.redemptionRepo.countActive(coupon.id),
      this.redemptionRepo.countActiveForCustomer(coupon.id, input.customerId),
    ]);

    const result = this.validationService.validate({
      coupon,
      now: input.now,
      customerId: input.customerId,
      totalActiveRedemptions,
      customerActiveRedemptions,
    });

    if (!result.valid) {
      throw new CouponValidationException(result.reason);
    }

    return { couponId: coupon.id, ruleId: result.ruleId };
  }

  // ── Redeem ────────────────────────────────────────────────────────────────

  /**
   * Hard enforcement pass — must be called inside the order $transaction,
   * after order.transitionTo(SOURCED), before the transaction commits.
   *
   * Recounts active redemptions inside the transaction to close the race
   * condition window between resolveCouponForPricing and now. If limits
   * have been exceeded by a concurrent order, throws CouponValidationException
   * which rolls back the entire transaction.
   *
   * The @@unique([orderId]) constraint on CouponRedemption provides a
   * final database-level guard against duplicate redemptions.
   */
  async redeemWithinTransaction(input: RedeemCouponInput, tx: PrismaTransactionClient): Promise<void> {
    const coupon = await this.couponRepo.load(input.couponId);

    if (!coupon) {
      // Should never happen — coupon was validated moments ago.
      // Throw rather than silently skip — this indicates a data integrity problem.
      throw new CouponNotFoundException(input.couponId);
    }

    // Recount inside the transaction — this is the race condition guard.
    // Any concurrent order that committed between our soft check and now
    // will be visible here.
    const [totalActiveRedemptions, customerActiveRedemptions] = await Promise.all([
      this.redemptionRepo.countActive(coupon.id),
      this.redemptionRepo.countActiveForCustomer(coupon.id, input.customerId),
    ]);

    const result = this.validationService.validate({
      coupon,
      now: input.now,
      customerId: input.customerId,
      totalActiveRedemptions,
      customerActiveRedemptions,
    });

    if (!result.valid) {
      // Throws here — rolls back the entire $transaction including the order save.
      throw new CouponValidationException(result.reason);
    }

    await this.redemptionRepo.redeem(
      {
        couponId: coupon.id,
        orderId: input.orderId,
        customerId: input.customerId,
      },
      tx,
    );
  }

  // ── Void ──────────────────────────────────────────────────────────────────

  /**
   * Voids the redemption for a cancelled order.
   * Called from the order cancellation flow when transitioning from SOURCED.
   * No-ops if the order had no coupon redemption.
   */
  async voidRedemption(orderId: string, tx: PrismaTransactionClient): Promise<void> {
    await this.redemptionRepo.voidByOrderId(orderId, tx);
  }
}
