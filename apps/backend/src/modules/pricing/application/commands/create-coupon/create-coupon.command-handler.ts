import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Coupon } from '../../../domain/entities/coupon.entity';
import { CouponRepositoryPort } from '../../../domain/ports/coupon.repository.port';
import { CreateCouponCommand } from './create-coupon.command';
import { CouponCodeAlreadyExistsException } from 'src/modules/pricing/domain/exceptions/coupon.exceptions';
import { PricingRuleRepositoryPort } from 'src/modules/pricing/domain/ports/pricing-rule.repository.port';
import {
  InvalidCouponPricingRuleTypeException,
  PricingRuleNotFoundException,
} from 'src/modules/pricing/domain/exceptions/pricing-rule.exceptions';
import { PricingRuleType } from '@repo/types';

@CommandHandler(CreateCouponCommand)
export class CreateCouponCommandHandler implements ICommandHandler<CreateCouponCommand, string> {
  constructor(
    private readonly couponRepository: CouponRepositoryPort,
    private readonly pricingRuleRepository: PricingRuleRepositoryPort,
  ) {}

  async execute(command: CreateCouponCommand): Promise<string> {
    const [existing, rule] = await Promise.all([
      this.couponRepository.loadByCode(command.tenantId, command.code),
      this.pricingRuleRepository.load(command.pricingRuleId),
    ]);

    if (existing) {
      throw new CouponCodeAlreadyExistsException(command.code);
    }

    if (!rule) {
      throw new PricingRuleNotFoundException(command.pricingRuleId);
    }

    if (rule.type !== PricingRuleType.COUPON) {
      throw new InvalidCouponPricingRuleTypeException(command.pricingRuleId);
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

    return this.couponRepository.save(coupon);
  }
}
