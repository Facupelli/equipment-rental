import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetRentalProductTypesQuery } from './get-rental-product-types.query';
import { GetRentalProductTypesRequestDto } from './get-rental-product-types.request.dto';
import { GetRentalProductTypesResponseDto } from './get-rental-product-types.response.dto';

@Controller('rental')
export class GetRentalProductTypesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('product-types')
  @Paginated()
  async getProductTypes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetRentalProductTypesRequestDto,
  ): Promise<GetRentalProductTypesResponseDto> {
    const sort = (
      dto as GetRentalProductTypesRequestDto & {
        sort?: 'price-desc' | 'price-asc' | 'alphabetical';
      }
    ).sort;

    return await this.queryBus.execute(
      new GetRentalProductTypesQuery(
        user.tenantId,
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
