import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';

import { CouponInUseError, CouponNotFoundError } from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';

import { DeleteCouponCommand } from './delete-coupon.command';

type DeleteCouponResult = Result<void, CouponNotFoundError | CouponInUseError>;

@CommandHandler(DeleteCouponCommand)
export class DeleteCouponService implements ICommandHandler<DeleteCouponCommand, DeleteCouponResult> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponRepository: CouponRepository,
  ) {}

  async execute(command: DeleteCouponCommand): Promise<DeleteCouponResult> {
    const coupon = await this.couponRepository.load(command.couponId);
    if (!coupon) {
      return err(new CouponNotFoundError(command.couponId));
    }

    const usage = await this.prisma.client.coupon.findUnique({
      where: { id: command.couponId },
      include: {
        _count: {
          select: {
            redemptions: true,
            orders: true,
          },
        },
      },
    });

    const hasRedemptions = (usage?._count.redemptions ?? 0) > 0;
    const hasOrders = (usage?._count.orders ?? 0) > 0;

    if (hasRedemptions || hasOrders) {
      return err(new CouponInUseError(command.couponId));
    }

    await this.prisma.client.coupon.delete({
      where: { id: command.couponId },
    });

    return ok(undefined);
  }
}
