import { ConflictException, Controller, Delete, NotFoundException, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  AssetHasActiveOrFutureBookingsError,
  AssetNotFoundError,
} from 'src/modules/inventory/domain/errors/inventory.errors';

import { SoftDeleteAssetCommand } from './soft-delete-asset.command';

@StaffRoute(Permission.DELETE_ASSETS)
@Controller('assets')
export class SoftDeleteAssetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new SoftDeleteAssetCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof AssetNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof AssetHasActiveOrFutureBookingsError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
