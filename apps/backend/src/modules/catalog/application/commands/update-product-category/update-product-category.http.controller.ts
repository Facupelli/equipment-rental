import { Body, BadRequestException, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  InvalidProductCategoryNameError,
  ProductCategoryNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

import { UpdateProductCategoryCommand } from './update-product-category.command';
import { UpdateProductCategoryRequestDto } from './update-product-category.request.dto';

@StaffRoute(Permission.UPDATE_PRODUCTS)
@Controller('product-categories')
export class UpdateProductCategoryHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(new UpdateProductCategoryCommand(user.tenantId, id, dto));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof ProductCategoryNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof InvalidProductCategoryNameError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
