import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRentalProductTypesQuery } from '../../application/queries/get-reantal-product-types/get-rental-product-types.query';
import { GetRentalProductTypesQueryDto } from '../../application/dto/rental/get-rental-product-types-query.dto';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { GetNewArrivalsQuery } from '../../application/queries/get-rental-new-arrivals/get-rental-new-arrival.query';
import { GetRentalBundlesQuery } from '../../application/queries/get-rental-bundles/get-rental-budles.query';
import { GetRentalBundlesQueryDto } from '../../application/dto/rental/get-rental-bundles-query.dto';
import { GetNewArrivalsQueryDto } from '../../application/dto/rental/get-new-arrivals-query.dto';

@Controller('rental')
export class RentalController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('product-types')
  @Paginated()
  async getRentalProductTypes(@Query() dto: GetRentalProductTypesQueryDto) {
    return await this.queryBus.execute(
      new GetRentalProductTypesQuery(dto.locationId, dto.categoryId, dto.search, dto.page, dto.limit),
    );
  }

  @Get('new-arrivals')
  async getNewArrivals(@Query() dto: GetNewArrivalsQueryDto) {
    return await this.queryBus.execute(new GetNewArrivalsQuery(dto.locationId));
  }

  @Get('bundles')
  async getBundles(@Query() dto: GetRentalBundlesQueryDto) {
    return await this.queryBus.execute(new GetRentalBundlesQuery(dto.locationId));
  }
}
