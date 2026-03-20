import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaTransactionClient } from '../../domain/ports/coupon.repository.port';

export type RedeemCouponInput = {
  couponId: string;
  orderId: string;
  customerId: string | undefined;
};

@Injectable()
export class CouponRedemptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Count of active (non-voided) redemptions for a coupon.
   * Used to enforce maxUses at validation time.
   */
  async countActive(couponId: string): Promise<number> {
    return this.prisma.client.couponRedemption.count({
      where: {
        couponId,
        voidedAt: null,
      },
    });
  }

  /**
   * Count of active redemptions for a specific customer on a coupon.
   * Used to enforce maxUsesPerCustomer at validation time.
   * Returns 0 for guest (undefined) callers — no identity to count against.
   */
  async countActiveForCustomer(couponId: string, customerId: string | undefined): Promise<number> {
    if (!customerId) return 0;

    return this.prisma.client.couponRedemption.count({
      where: {
        couponId,
        customerId,
        voidedAt: null,
      },
    });
  }

  /**
   * Records a redemption atomically inside the order transaction.
   * Must be called inside the same $transaction block as the order save
   * to prevent phantom redemptions from abandoned checkouts.
   */
  async redeem(input: RedeemCouponInput, tx: PrismaTransactionClient): Promise<void> {
    await tx.couponRedemption.create({
      data: {
        couponId: input.couponId,
        orderId: input.orderId,
        customerId: input.customerId ?? null,
        redeemedAt: new Date(),
      },
    });
  }

  /**
   * Voids the redemption for a cancelled order.
   * Only called when the order is cancelled from SOURCED status —
   * redemptions for orders that reached ACTIVE are never voided.
   * No-ops gracefully if no redemption exists (order had no coupon).
   */
  async voidByOrderId(orderId: string, tx: PrismaTransactionClient): Promise<void> {
    await tx.couponRedemption.updateMany({
      where: {
        orderId,
        voidedAt: null,
      },
      data: {
        voidedAt: new Date(),
      },
    });
  }
}
