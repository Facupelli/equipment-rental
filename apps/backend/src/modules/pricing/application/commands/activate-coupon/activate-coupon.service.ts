import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { CouponNotFoundError } from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';

import { ActivateCouponCommand } from './activate-coupon.command';

type ActivateCouponResult = Result<void, CouponNotFoundError>;

@CommandHandler(ActivateCouponCommand)
export class ActivateCouponService implements ICommandHandler<ActivateCouponCommand, ActivateCouponResult> {
  constructor(private readonly couponRepository: CouponRepository) {}

  async execute(command: ActivateCouponCommand): Promise<ActivateCouponResult> {
    const coupon = await this.couponRepository.load(command.couponId);
    if (!coupon) {
      return err(new CouponNotFoundError(command.couponId));
    }

    coupon.activate();
    await this.couponRepository.save(coupon);

    return ok(undefined);
  }
}
