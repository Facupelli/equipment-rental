import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission, PromotionActivationType } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { ListPromotionsQuery } from './list-promotions.query';
import { ListPromotionsRequestDto } from './list-promotions.request.dto';
import { ListPromotionsResponseDto } from './list-promotions.response.dto';

@StaffRoute(Permission.VIEW_PRICING)
@Controller('pricing/promotions')
export class ListPromotionsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  @HttpCode(HttpStatus.OK)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPromotionsRequestDto,
  ): Promise<ListPromotionsResponseDto> {
    return this.queryBus.execute(
      new ListPromotionsQuery(
        user.tenantId,
        query.page,
        query.limit,
        query.search,
        query.activationType as PromotionActivationType | undefined,
      ),
    );
  }
}
