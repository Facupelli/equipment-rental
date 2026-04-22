import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetOrdersCalendarQuery } from './get-orders-calendar.query';
import { GetOrdersCalendarRequestDto } from './get-orders-calendar.request.dto';
import { GetOrdersCalendarResponseDto } from './get-orders-calendar.response.dto';

@StaffRoute(Permission.VIEW_ORDERS)
@Controller('orders/calendar')
export class GetOrdersCalendarHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getOrdersCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetOrdersCalendarRequestDto,
  ): Promise<GetOrdersCalendarResponseDto> {
    return this.queryBus.execute(
      new GetOrdersCalendarQuery(user.tenantId, dto.locationId, dto.rangeStart, dto.rangeEnd),
    );
  }
}
