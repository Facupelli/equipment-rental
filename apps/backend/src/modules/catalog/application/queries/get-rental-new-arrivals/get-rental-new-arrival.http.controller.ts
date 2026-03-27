import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetNewArrivalsQuery } from './get-rental-new-arrival.query';
import { GetNewArrivalsRequestDto } from './get-rental-new-arrival.request.dto';
import { GetNewArrivalsResponseDto } from './get-rental-new-arrival.response.dto';

@Controller('rental')
export class GetNewArrivalsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('new-arrivals')
  async getNewArrivals(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetNewArrivalsRequestDto,
  ): Promise<GetNewArrivalsResponseDto> {
    return await this.queryBus.execute(new GetNewArrivalsQuery(user.tenantId, dto.locationId));
  }
}
