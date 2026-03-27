import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetProductTypesQuery } from './get-product-types.query';
import { GetProductTypesRequestDto } from './get-product-types.request.dto';
import { GetProductTypesResponseDto } from './get-product-types.response.dto';

@Controller('product-types')
export class GetProductTypesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Paginated()
  async getProductTypes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: GetProductTypesRequestDto,
  ): Promise<GetProductTypesResponseDto> {
    return await this.queryBus.execute(
      new GetProductTypesQuery(user.tenantId, dto.categoryId, dto.isActive, dto.search, dto.page, dto.limit),
    );
  }
}
