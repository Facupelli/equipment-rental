import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateCouponCommand } from '../../application/commands/create-coupon/create-coupon.command';
import { CreateCouponDto } from '@repo/schemas';

@Controller('pricing/coupons')
export class CouponsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(@CurrentUser() user: ReqUser, @Body() dto: CreateCouponDto): Promise<{ id: string }> {
    const id: string = await this.commandBus.execute(
      new CreateCouponCommand(
        user.tenantId,
        dto.pricingRuleId,
        dto.code,
        dto.maxUses,
        dto.maxUsesPerCustomer,
        dto.restrictedToCustomerId,
        dto.validFrom,
        dto.validUntil,
      ),
    );

    return { id };
  }
}
