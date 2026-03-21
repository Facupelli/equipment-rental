import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateCouponCommand } from '../../application/commands/create-coupon/create-coupon.command';
import { CouponView, CreateCouponDto, PaginatedDto } from '@repo/schemas';
import { ListCouponsQueryDto } from '../../application/dto/list-coupons-query.dto';
import { ListCouponsQuery } from '../../presentation/queries/list-coupons/list-coupons.query';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

@Controller('pricing/coupons')
export class CouponsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @Get()
  @Paginated()
  @HttpCode(HttpStatus.OK)
  async listCoupons(
    @CurrentUser() user: ReqUser,
    @Query() query: ListCouponsQueryDto,
  ): Promise<PaginatedDto<CouponView>> {
    return this.queryBus.execute(new ListCouponsQuery(user.tenantId, query.page, query.limit, query.search));
  }
}
