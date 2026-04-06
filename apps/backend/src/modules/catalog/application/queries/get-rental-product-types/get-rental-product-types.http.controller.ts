import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';
import { GetRentalProductTypesQuery } from './get-rental-product-types.query';
import { GetRentalProductTypesRequestDto } from './get-rental-product-types.request.dto';
import { GetRentalProductTypesResponseDto } from './get-rental-product-types.response.dto';
import { Public } from 'src/core/decorators/public.decorator';

@Public()
@Controller('rental')
export class GetRentalProductTypesHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('product-types')
  @Paginated()
  async getProductTypes(@Query() dto: GetRentalProductTypesRequestDto): Promise<GetRentalProductTypesResponseDto> {
    const sort = (
      dto as GetRentalProductTypesRequestDto & {
        sort?: 'price-desc' | 'price-asc' | 'alphabetical';
      }
    ).sort;

    return await this.queryBus.execute(
      new GetRentalProductTypesQuery(
        this.tenantContext.requireTenantId(),
        dto.locationId,
        dto.startDate,
        dto.endDate,
        dto.categoryId,
        dto.search,
        sort,
        dto.page,
        dto.limit,
      ),
    );
  }
}
