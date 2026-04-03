import { Body, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { UpdateLocationCommand } from './update-location.command';
import { UpdateLocationRequestDto } from './update-location.request.dto';
import { LocationNotFoundError } from '../../../domain/errors/location.errors';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('locations')
export class UpdateLocationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLocationRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateLocationCommand(user.tenantId, id, {
        name: dto.name,
        address: dto.address,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof LocationNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
