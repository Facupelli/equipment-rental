import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { ListLongRentalDiscountsQuery } from './list-long-rental-discounts.query';
import { ListLongRentalDiscountsRequestDto } from './list-long-rental-discounts.request.dto';
import { ListLongRentalDiscountsResponseDto } from './list-long-rental-discounts.response.dto';

@StaffRoute(Permission.VIEW_PRICING)
@Controller('pricing/long-rental-discounts')
export class ListLongRentalDiscountsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  @HttpCode(HttpStatus.OK)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLongRentalDiscountsRequestDto,
  ): Promise<ListLongRentalDiscountsResponseDto> {
    return this.queryBus.execute(
      new ListLongRentalDiscountsQuery(user.tenantId, query.page, query.limit, query.search),
    );
  }
}
