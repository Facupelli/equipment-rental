import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { RentalLocationsResponse } from '@repo/schemas';

import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';

import { GetRentalLocationsQuery } from './get-rental-locations.query';
import { Public } from 'src/core/decorators/public.decorator';

@Public()
@Controller('rental/locations')
export class GetRentalLocationsHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  async getLocations(): Promise<RentalLocationsResponse> {
    return this.queryBus.execute(new GetRentalLocationsQuery(this.tenantContext.requireTenantId()));
  }
}
