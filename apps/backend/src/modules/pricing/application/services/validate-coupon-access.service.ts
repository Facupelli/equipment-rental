import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponNotFoundError, CouponValidationError } from '../../domain/errors/pricing.errors';
import { CouponValidationService } from '../../domain/services/coupon-validation.service';
import { CouponRedemptionRepository } from '../../infrastructure/repositories/coupon-redemption.repository';
import { CouponRepository } from '../../infrastructure/repositories/coupon.repository';

export type ValidatedCouponAccess = {
  coupon: Coupon;
  promotionId: string;
};

export type ValidateCouponAccessError = CouponNotFoundError | CouponValidationError;

export type ValidateCouponByCodeInput = {
  tenantId: string;
  code: string;
  customerId: string | undefined;
  now: Date;
  tx?: PrismaTransactionClient;
};

export type ValidateCouponByIdInput = {
  couponId: string;
  customerId: string | undefined;
  now: Date;
  tx?: PrismaTransactionClient;
};

@Injectable()
export class ValidateCouponAccessService {
  private readonly validationService = new CouponValidationService();

  constructor(
    private readonly couponRepo: CouponRepository,
    private readonly redemptionRepo: CouponRedemptionRepository,
  ) {}

  async validateByCode(
    input: ValidateCouponByCodeInput,
  ): Promise<Result<ValidatedCouponAccess, ValidateCouponAccessError>> {
    const coupon = await this.couponRepo.loadByTenantAndCode(input.tenantId, input.code, input.tx);

    if (!coupon) {
      return err(new CouponNotFoundError(input.code));
    }

    return this.validateLoadedCoupon({
      coupon,
      customerId: input.customerId,
      now: input.now,
      tx: input.tx,
    });
  }

  async validateById(
    input: ValidateCouponByIdInput,
  ): Promise<Result<ValidatedCouponAccess, ValidateCouponAccessError>> {
    const coupon = await this.couponRepo.load(input.couponId, input.tx);

    if (!coupon) {
      return err(new CouponNotFoundError(input.couponId));
    }

    return this.validateLoadedCoupon({
      coupon,
      customerId: input.customerId,
      now: input.now,
      tx: input.tx,
    });
  }

  private async validateLoadedCoupon(input: {
    coupon: Coupon;
    customerId: string | undefined;
    now: Date;
    tx?: PrismaTransactionClient;
  }): Promise<Result<ValidatedCouponAccess, ValidateCouponAccessError>> {
    const { coupon, customerId, now, tx } = input;

    const [totalActiveRedemptions, customerActiveRedemptions] = await Promise.all([
      this.redemptionRepo.countActive(coupon.id, tx),
      this.redemptionRepo.countActiveForCustomer(coupon.id, customerId, tx),
    ]);

    const result = this.validationService.validate({
      coupon,
      now,
      customerId,
      totalActiveRedemptions,
      customerActiveRedemptions,
    });

    if (result.valid) {
      return ok({ coupon, promotionId: result.promotionId });
    }

    return err(new CouponValidationError(result.reason));
  }
}
