import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'src/core/result';
import { PricingRuleType } from '@repo/types';
import { Coupon } from '../../../domain/entities/coupon.entity';
import {
  CouponCodeAlreadyExistsError,
  PricingRuleNotCouponTypeError,
  PricingRuleNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';
import { PricingRuleRepository } from '../../../infrastructure/repositories/pricing-rule.repository';
import { CreateCouponCommand } from './create-coupon.command';

type CreateCouponError = CouponCodeAlreadyExistsError | PricingRuleNotFoundError | PricingRuleNotCouponTypeError;

@CommandHandler(CreateCouponCommand)
export class CreateCouponService implements ICommandHandler<CreateCouponCommand, Result<string, CreateCouponError>> {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly pricingRuleRepository: PricingRuleRepository,
  ) {}

  async execute(command: CreateCouponCommand): Promise<Result<string, CreateCouponError>> {
    const [existing, rule] = await Promise.all([
      this.couponRepository.loadByCode(command.tenantId, command.code),
      this.pricingRuleRepository.load(command.pricingRuleId),
    ]);

    if (existing) {
      return err(new CouponCodeAlreadyExistsError(command.code));
    }

    if (!rule) {
      return err(new PricingRuleNotFoundError(command.pricingRuleId));
    }

    if (rule.type !== PricingRuleType.COUPON) {
      return err(new PricingRuleNotCouponTypeError(command.pricingRuleId));
    }

    const coupon = Coupon.create({
      tenantId: command.tenantId,
      pricingRuleId: command.pricingRuleId,
      code: command.code,
      maxUses: command.maxUses,
      maxUsesPerCustomer: command.maxUsesPerCustomer,
      restrictedToCustomerId: command.restrictedToCustomerId,
      validFrom: command.validFrom,
      validUntil: command.validUntil,
    });

    const id = await this.couponRepository.save(coupon);
    return ok(id);
  }
}
