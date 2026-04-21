import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CreateLocationCommand } from './create-location.command';
import { CreateLocationDto } from './create-location.request.dto';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('locations')
export class CreateLocationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLocationDto): Promise<string> {
    const command = new CreateLocationCommand(
      user.tenantId,
      dto.name,
      dto.address,
      dto.timezone,
      dto.supportsDelivery,
      dto.deliveryDefaults,
    );
    return this.commandBus.execute(command);
  }
}
