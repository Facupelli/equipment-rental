import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'src/core/result';
import { CouponNotFoundError, CouponValidationError } from '../../domain/errors/pricing.errors';
import { CouponValidationService } from '../../domain/services/coupon-validation.service';
import { CouponRepository } from '../../infrastructure/repositories/coupon.repository';
import { CouponRedemptionRepository } from '../../infrastructure/repositories/coupon-redemption.repository';

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

export type ResolveCouponForPricingError = CouponNotFoundError | CouponValidationError;

@Injectable()
export class ResolveCouponForPricingService {
  private readonly validationService = new CouponValidationService();

  constructor(
    private readonly couponRepo: CouponRepository,
    private readonly redemptionRepo: CouponRedemptionRepository,
  ) {}

  async resolveCouponForPricing(
    input: ResolveCouponInput,
  ): Promise<Result<ResolveCouponResult, ResolveCouponForPricingError>> {
    const coupon = await this.couponRepo.loadByCode(input.tenantId, input.code);

    if (!coupon) {
      return err(new CouponNotFoundError(input.code));
    }

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
      return err(new CouponValidationError(result.reason));
    }

    return ok({ couponId: coupon.id, ruleId: result.ruleId });
  }
}
