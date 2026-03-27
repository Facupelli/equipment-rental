import { Injectable } from '@nestjs/common';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { CouponRedemptionRepository } from '../../infrastructure/repositories/coupon-redemption.repository';

@Injectable()
export class VoidCouponRedemptionService {
  constructor(private readonly redemptionRepo: CouponRedemptionRepository) {}

  async voidRedemption(orderId: string, tx: PrismaTransactionClient): Promise<void> {
    await this.redemptionRepo.voidByOrderId(orderId, tx);
  }
}
