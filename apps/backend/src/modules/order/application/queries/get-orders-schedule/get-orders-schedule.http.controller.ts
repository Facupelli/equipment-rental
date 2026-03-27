import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetOrdersScheduleQuery } from './get-orders-schedule.query';
import { GetOrdersScheduleRequestDto } from './get-orders-schedule.request.dto';
import { GetOrdersScheduleResponseDto } from './get-orders-schedule.response.dto';

@Controller('orders/schedule')
export class GetOrdersScheduleHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getOrdersSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetOrdersScheduleRequestDto,
  ): Promise<GetOrdersScheduleResponseDto> {
    return this.queryBus.execute(new GetOrdersScheduleQuery(user.tenantId, dto.locationId, dto.from, dto.to));
  }
}
