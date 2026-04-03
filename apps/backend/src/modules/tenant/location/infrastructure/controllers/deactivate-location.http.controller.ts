import { Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { DeactivateLocationCommand } from '../../application/commands/deactivate-location/deactivate-location.command';
import { LocationNotFoundError } from '../../domain/errors/location.errors';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('locations')
export class DeactivateLocationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/deactivate')
  async deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new DeactivateLocationCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof LocationNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
