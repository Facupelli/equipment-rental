import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import { PromotionActivationType } from '@repo/types';
import { PrismaService } from 'src/core/database/prisma.service';
import { Coupon } from '../../../domain/entities/coupon.entity';
import {
  CouponCodeAlreadyExistsError,
  PromotionNotCouponActivatedError,
  PromotionNotFoundError,
} from '../../../domain/errors/pricing.errors';
import { CouponRepository } from '../../../infrastructure/repositories/coupon.repository';
import { PromotionRepository } from '../../../infrastructure/repositories/promotion.repository';
import { CreateCouponCommand } from './create-coupon.command';

type CreateCouponError = CouponCodeAlreadyExistsError | PromotionNotFoundError | PromotionNotCouponActivatedError;

@CommandHandler(CreateCouponCommand)
export class CreateCouponService implements ICommandHandler<CreateCouponCommand, Result<string, CreateCouponError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponRepository: CouponRepository,
    private readonly promotionRepository: PromotionRepository,
  ) {}

  async execute(command: CreateCouponCommand): Promise<Result<string, CreateCouponError>> {
    const [existing, rule] = await Promise.all([
      this.prisma.client.coupon.findFirst({
        where: {
          code: command.code.trim().toUpperCase(),
        },
      }),
      this.promotionRepository.load(command.promotionId),
    ]);

    if (existing) {
      return err(new CouponCodeAlreadyExistsError(command.code));
    }

    if (!rule) {
      return err(new PromotionNotFoundError(command.promotionId));
    }

    if (rule.activationType !== PromotionActivationType.COUPON) {
      return err(new PromotionNotCouponActivatedError(command.promotionId));
    }

    const coupon = Coupon.create({
      tenantId: command.tenantId,
      promotionId: command.promotionId,
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
