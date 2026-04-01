import { ConflictException, Controller, Delete, NotFoundException, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  ProductCategoryHasAssignedProductTypesError,
  ProductCategoryNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

import { DeleteProductCategoryCommand } from './delete-product-category.command';

@StaffRoute(Permission.UPDATE_PRODUCTS)
@Controller('product-categories')
export class DeleteProductCategoryHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeleteProductCategoryCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof ProductCategoryNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ProductCategoryHasAssignedProductTypesError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
