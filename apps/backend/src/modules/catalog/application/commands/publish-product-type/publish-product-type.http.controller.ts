import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ConflictException, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { PublishProductTypeCommand } from './publish-product-type.command';
import {
  ProductTypeAlreadyPublishedError,
  ProductTypeAlreadyRetiredError,
  ProductTypeNotFoundError,
} from '../../../domain/errors/catalog.errors';

@StaffRoute(Permission.UPDATE_PRODUCTS)
@Controller('product-types')
export class PublishProductTypeHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/publish')
  async publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new PublishProductTypeCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof ProductTypeNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ProductTypeAlreadyPublishedError || error instanceof ProductTypeAlreadyRetiredError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
