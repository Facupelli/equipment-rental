import { Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { AssetNotFoundError } from 'src/modules/inventory/domain/errors/inventory.errors';

import { DeactivateAssetCommand } from './deactivate-asset.command';

@StaffRoute(Permission.UPDATE_ASSETS)
@Controller('assets')
export class DeactivateAssetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/deactivate')
  async deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeactivateAssetCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof AssetNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
