import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { CouponNotFoundError, CouponValidationError } from '../../domain/errors/pricing.errors';
import { CouponRedemptionRepository } from '../../infrastructure/repositories/coupon-redemption.repository';
import { ValidateCouponAccessService } from './validate-coupon-access.service';

export type RedeemCouponInput = {
  couponId: string;
  orderId: string;
  customerId: string | undefined;
  now: Date;
};

export type RedeemCouponError = CouponNotFoundError | CouponValidationError;

@Injectable()
export class RedeemCouponService {
  constructor(
    private readonly redemptionRepo: CouponRedemptionRepository,
    private readonly validateCouponAccess: ValidateCouponAccessService,
  ) {}

  async redeemWithinTransaction(
    input: RedeemCouponInput,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, RedeemCouponError>> {
    const result = await this.validateCouponAccess.validateById({
      couponId: input.couponId,
      customerId: input.customerId,
      now: input.now,
      tx,
    });

    if (result.isErr()) {
      return err(result.error);
    }

    await this.redemptionRepo.redeem(
      {
        couponId: result.value.coupon.id,
        orderId: input.orderId,
        customerId: input.customerId,
      },
      tx,
    );

    return ok(undefined);
  }
}
