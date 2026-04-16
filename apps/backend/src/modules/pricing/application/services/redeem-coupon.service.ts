import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { CouponNotFoundError, CouponValidationError } from '../../domain/errors/pricing.errors';
import { CouponValidationService } from '../../domain/services/coupon-validation.service';
import { CouponRepository } from '../../infrastructure/repositories/coupon.repository';
import { CouponRedemptionRepository } from '../../infrastructure/repositories/coupon-redemption.repository';

export type RedeemCouponInput = {
  couponId: string;
  orderId: string;
  customerId: string | undefined;
  now: Date;
};

export type RedeemCouponError = CouponNotFoundError | CouponValidationError;

@Injectable()
export class RedeemCouponService {
  private readonly validationService = new CouponValidationService();

  constructor(
    private readonly couponRepo: CouponRepository,
    private readonly redemptionRepo: CouponRedemptionRepository,
  ) {}

  async redeemWithinTransaction(
    input: RedeemCouponInput,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, RedeemCouponError>> {
    const coupon = await this.couponRepo.load(input.couponId);

    if (!coupon) {
      return err(new CouponNotFoundError(input.couponId));
    }

    const [totalActiveRedemptions, customerActiveRedemptions] = await Promise.all([
      this.redemptionRepo.countActive(coupon.id, tx),
      this.redemptionRepo.countActiveForCustomer(coupon.id, input.customerId, tx),
    ]);

    const result = this.validationService.validate({
      coupon,
      now: input.now,
      customerId: input.customerId,
      totalActiveRedemptions,
      customerActiveRedemptions,
    });

    if (!result.valid) {
      return err(new CouponValidationError(result.reason));
    }

    await this.redemptionRepo.redeem(
      {
        couponId: coupon.id,
        orderId: input.orderId,
        customerId: input.customerId,
      },
      tx,
    );

    return ok(undefined);
  }
}
