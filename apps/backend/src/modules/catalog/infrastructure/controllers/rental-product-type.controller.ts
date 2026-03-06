import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRentalProductTypesQuery } from '../../application/queries/get-reantal-product-types/get-rental-product-types.query';
import { GetRentalProductTypesQueryDto } from '../../application/dto/get-rental-product-types-query.dto';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

@Controller('rental')
export class RentalProductTypeController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('product-types')
  @Paginated()
  async getRentalProductTypes(@Query() dto: GetRentalProductTypesQueryDto) {
    return await this.queryBus.execute(
      new GetRentalProductTypesQuery(dto.locationId, dto.categoryId, dto.search, dto.page, dto.limit),
    );
  }
}
