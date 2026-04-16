import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PromotionActivationType } from '@repo/types';
import { Result, err, ok } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';

import {
  CouponCodeAlreadyExistsError,
  PromotionNotCouponActivatedError,
  PromotionNotFoundError,
  CouponNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';

import { UpdateCouponCommand } from './update-coupon.command';

type UpdateCouponError =
  | CouponCodeAlreadyExistsError
  | CouponNotFoundError
  | PromotionNotFoundError
  | PromotionNotCouponActivatedError;

@CommandHandler(UpdateCouponCommand)
export class UpdateCouponService implements ICommandHandler<UpdateCouponCommand, Result<void, UpdateCouponError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponRepository: CouponRepository,
    private readonly promotionRepository: PromotionRepository,
  ) {}

  async execute(command: UpdateCouponCommand): Promise<Result<void, UpdateCouponError>> {
    const [coupon, existing, rule] = await Promise.all([
      this.couponRepository.load(command.couponId),
      this.prisma.client.coupon.findFirst({
        where: {
          code: command.code.trim().toUpperCase(),
          id: { not: command.couponId },
        },
      }),
      this.promotionRepository.load(command.promotionId),
    ]);

    if (!coupon) {
      return err(new CouponNotFoundError(command.couponId));
    }

    if (existing) {
      return err(new CouponCodeAlreadyExistsError(command.code));
    }

    if (!rule) {
      return err(new PromotionNotFoundError(command.promotionId));
    }

    if (rule.activationType !== PromotionActivationType.COUPON) {
      return err(new PromotionNotCouponActivatedError(command.promotionId));
    }

    coupon.update({
      promotionId: command.promotionId,
      code: command.code,
      maxUses: command.maxUses,
      maxUsesPerCustomer: command.maxUsesPerCustomer,
      restrictedToCustomerId: command.restrictedToCustomerId,
      validFrom: command.validFrom,
      validUntil: command.validUntil,
    });

    await this.couponRepository.save(coupon);

    return ok(undefined);
  }
}
