import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetProductTypeByIdQuery } from './get-product-type-by-id.query';
import { GetProductTypeByIdResponseDto } from './get-product-type-by-id.response.dto';

@StaffRoute(Permission.VIEW_PRODUCTS)
@Controller('product-types')
export class GetProductTypeByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<GetProductTypeByIdResponseDto> {
    const result = await this.queryBus.execute(new GetProductTypeByIdQuery(user.tenantId, id));

    if (!result) {
      throw new NotFoundException('Product type not found');
    }

    return result;
  }
}
