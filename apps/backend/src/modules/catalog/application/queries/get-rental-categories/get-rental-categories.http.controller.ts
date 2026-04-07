import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { Public } from 'src/core/decorators/public.decorator';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';

import { GetProductCategoriesQuery } from '../get-product-categories/get-product-categories.query';
import { GetProductCategoriesResponseDto } from '../get-product-categories/get-product-categories.response.dto';

@Public()
@Controller('rental/categories')
export class GetRentalCategoriesHttpController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  async getCategories(): Promise<GetProductCategoriesResponseDto> {
    return await this.queryBus.execute(new GetProductCategoriesQuery(this.tenantContext.requireTenantId()));
  }
}
