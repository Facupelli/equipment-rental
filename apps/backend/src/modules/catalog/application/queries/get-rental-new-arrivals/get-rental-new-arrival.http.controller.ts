import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';
import { GetNewArrivalsQuery } from './get-rental-new-arrival.query';
import { GetNewArrivalsRequestDto } from './get-rental-new-arrival.request.dto';
import { GetNewArrivalsResponseDto } from './get-rental-new-arrival.response.dto';
import { Public } from 'src/core/decorators/public.decorator';

@Public()
@Controller('rental')
export class GetNewArrivalsHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('new-arrivals')
  async getNewArrivals(@Query() dto: GetNewArrivalsRequestDto): Promise<GetNewArrivalsResponseDto> {
    return await this.queryBus.execute(new GetNewArrivalsQuery(this.tenantContext.requireTenantId(), dto.locationId));
  }
}
