import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PricingRuleType } from '@repo/types';
import { Result, err, ok } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';

import {
  CouponCodeAlreadyExistsError,
  PricingRuleNotCouponTypeError,
  PricingRuleNotFoundError,
  CouponNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';

import { UpdateCouponCommand } from './update-coupon.command';

type UpdateCouponError =
  | CouponCodeAlreadyExistsError
  | CouponNotFoundError
  | PricingRuleNotFoundError
  | PricingRuleNotCouponTypeError;

@CommandHandler(UpdateCouponCommand)
export class UpdateCouponService implements ICommandHandler<UpdateCouponCommand, Result<void, UpdateCouponError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponRepository: CouponRepository,
    private readonly pricingRuleRepository: PricingRuleRepository,
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
      this.pricingRuleRepository.load(command.pricingRuleId),
    ]);

    if (!coupon) {
      return err(new CouponNotFoundError(command.couponId));
    }

    if (existing) {
      return err(new CouponCodeAlreadyExistsError(command.code));
    }

    if (!rule) {
      return err(new PricingRuleNotFoundError(command.pricingRuleId));
    }

    if (rule.type !== PricingRuleType.COUPON) {
      return err(new PricingRuleNotCouponTypeError(command.pricingRuleId));
    }

    coupon.update({
      pricingRuleId: command.pricingRuleId,
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
