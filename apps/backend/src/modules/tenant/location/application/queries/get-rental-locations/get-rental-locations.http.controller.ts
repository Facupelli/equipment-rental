import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { RentalLocationsResponse } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { CustomerOnly } from 'src/core/decorators/customer-only.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetRentalLocationsQuery } from './get-rental-locations.query';

@CustomerOnly()
@Controller('rental/locations')
export class GetRentalLocationsHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getLocations(@CurrentUser() user: AuthenticatedUser): Promise<RentalLocationsResponse> {
    return this.queryBus.execute(new GetRentalLocationsQuery(user.tenantId));
  }
}
