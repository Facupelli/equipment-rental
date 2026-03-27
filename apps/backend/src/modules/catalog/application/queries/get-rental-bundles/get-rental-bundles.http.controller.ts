import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetRentalBundlesQuery } from './get-rental-bundles.query';
import { GetRentalBundlesRequestDto } from './get-rental-bundles.request.dto';
import { GetRentalBundlesResponseDto } from './get-rental-bundles.response.dto';

@Controller('rental')
export class GetRentalBundlesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('bundles')
  async getBundles(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetRentalBundlesRequestDto,
  ): Promise<GetRentalBundlesResponseDto> {
    return await this.queryBus.execute(new GetRentalBundlesQuery(user.tenantId, dto.locationId));
  }
}
