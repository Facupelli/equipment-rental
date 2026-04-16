import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';
import { CouponNotFoundError, CouponValidationError } from '../../domain/errors/pricing.errors';
import { CouponValidationService } from '../../domain/services/coupon-validation.service';
import { CouponRepository } from '../../infrastructure/repositories/coupon.repository';
import { CouponRedemptionRepository } from '../../infrastructure/repositories/coupon-redemption.repository';

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
  private readonly validationService = new CouponValidationService();

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponRepo: CouponRepository,
    private readonly redemptionRepo: CouponRedemptionRepository,
  ) {}

  async resolveCouponForPricing(
    input: ResolveCouponInput,
  ): Promise<Result<ResolveCouponResult, ResolveCouponForPricingError>> {
    const couponRecord = await this.prisma.client.coupon.findFirst({
      where: {
        tenantId: input.tenantId,
        code: input.code.trim().toUpperCase(),
      },
      select: {
        id: true,
      },
    });

    if (!couponRecord) {
      return err(new CouponNotFoundError(input.code));
    }

    const coupon = await this.couponRepo.load(couponRecord.id);

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

    return ok({ couponId: coupon.id, promotionId: result.promotionId });
  }
}
