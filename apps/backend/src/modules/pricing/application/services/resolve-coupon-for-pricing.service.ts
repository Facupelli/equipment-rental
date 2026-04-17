import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { CouponNotFoundError, CouponValidationError } from '../../domain/errors/pricing.errors';
import { ValidateCouponAccessService } from './validate-coupon-access.service';

export type ResolveCouponResult = {
  couponId: string;
  promotionId: string;
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
  constructor(private readonly validateCouponAccess: ValidateCouponAccessService) {}

  async resolveCouponForPricing(
    input: ResolveCouponInput,
  ): Promise<Result<ResolveCouponResult, ResolveCouponForPricingError>> {
    const result = await this.validateCouponAccess.validateByCode({
      tenantId: input.tenantId,
      code: input.code,
      customerId: input.customerId,
      now: input.now,
    });

    if (result.isErr()) {
      return err(result.error);
    }

    return ok({ couponId: result.value.coupon.id, promotionId: result.value.promotionId });
  }
}
