import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetCalendarDotsQuery } from './get-calendar-dots.query';
import { GetCalendarDotsRequestDto } from './get-calendar-dots.request.dto';
import { GetCalendarDotsResponseDto } from './get-calendar-dots.response.dto';

@Controller('orders/calendar-dots')
export class GetCalendarDotsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getCalendarDots(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetCalendarDotsRequestDto,
  ): Promise<GetCalendarDotsResponseDto> {
    return this.queryBus.execute(new GetCalendarDotsQuery(user.tenantId, dto.locationId, dto.from, dto.to));
  }
}
