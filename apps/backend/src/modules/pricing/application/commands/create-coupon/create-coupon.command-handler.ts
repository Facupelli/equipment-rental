import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Coupon } from '../../../domain/entities/coupon.entity';
import { CouponRepositoryPort } from '../../../domain/ports/coupon.repository.port';

import { CreateCouponCommand } from './create-coupon.command';
import { CouponCodeAlreadyExistsException } from 'src/modules/pricing/domain/exceptions/coupon.exceptions';

@CommandHandler(CreateCouponCommand)
export class CreateCouponCommandHandler implements ICommandHandler<CreateCouponCommand, string> {
  constructor(private readonly couponRepository: CouponRepositoryPort) {}

  async execute(command: CreateCouponCommand): Promise<string> {
    const existing = await this.couponRepository.loadByCode(command.tenantId, command.code);
    if (existing) {
      throw new CouponCodeAlreadyExistsException(command.code);
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
