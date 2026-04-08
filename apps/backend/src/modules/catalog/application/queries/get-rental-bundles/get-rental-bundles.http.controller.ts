import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';
import { GetRentalBundlesQuery } from './get-rental-bundles.query';
import { GetRentalBundlesRequestDto } from './get-rental-bundles.request.dto';
import { GetRentalBundlesResponseDto } from './get-rental-bundles.response.dto';
import { Public } from 'src/core/decorators/public.decorator';

@Public()
@Controller('rental')
export class GetRentalBundlesHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('bundles')
  async getBundles(@Query() dto: GetRentalBundlesRequestDto): Promise<GetRentalBundlesResponseDto> {
    return await this.queryBus.execute(
      new GetRentalBundlesQuery(this.tenantContext.requireTenantId(), dto.locationId, dto.pickupDate, dto.returnDate),
    );
  }
}
