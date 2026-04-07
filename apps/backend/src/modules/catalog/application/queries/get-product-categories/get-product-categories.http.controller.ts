import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { GetProductCategoriesQuery } from './get-product-categories.query';
import { GetProductCategoriesResponseDto } from './get-product-categories.response.dto';

@StaffRoute(Permission.VIEW_PRODUCTS)
@Controller('product-categories')
export class GetProductCategoriesHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getCategories(@CurrentUser() user: AuthenticatedUser): Promise<GetProductCategoriesResponseDto> {
    return await this.queryBus.execute(new GetProductCategoriesQuery(user.tenantId));
  }
}
