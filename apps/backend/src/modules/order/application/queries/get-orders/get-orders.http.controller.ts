import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetOrdersQuery } from './get-orders.query';
import { GetOrdersRequestDto } from './get-orders.request.dto';
import type { GetOrdersResponseDto } from './get-orders.response.dto';

@StaffRoute(Permission.VIEW_ORDERS)
@Controller('orders')
export class GetOrdersHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  async getOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetOrdersRequestDto,
  ): Promise<GetOrdersResponseDto> {
    return this.queryBus.execute(
      new GetOrdersQuery(
        user.tenantId,
        dto.page,
        dto.limit,
        dto.locationId,
        dto.customerId,
        dto.status,
        dto.orderNumber,
        dto.dateLens,
        dto.sortBy,
        dto.sortDirection,
      ),
    );
  }
}
