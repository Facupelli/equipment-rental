import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { CouponNotFoundError } from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';

import { DeactivateCouponCommand } from './deactivate-coupon.command';

type DeactivateCouponResult = Result<void, CouponNotFoundError>;

@CommandHandler(DeactivateCouponCommand)
export class DeactivateCouponService implements ICommandHandler<DeactivateCouponCommand, DeactivateCouponResult> {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(command: DeactivateCouponCommand): Promise<DeactivateCouponResult> {
    const coupon = await this.couponRepository.load(command.couponId);
    if (!coupon) {
      return err(new CouponNotFoundError(command.couponId));
    }

    coupon.deactivate();
    await this.couponRepository.save(coupon);

    return ok(undefined);
  }
}
