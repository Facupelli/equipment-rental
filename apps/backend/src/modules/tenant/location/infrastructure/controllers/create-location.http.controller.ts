import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CreateLocationCommand } from '../../application/commands/create-location/create-location.command';
import { CreateLocationDto } from '../../application/commands/create-location/create-location.request.dto';

@Controller('locations')
export class CreateLocationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLocationDto): Promise<string> {
    const command = new CreateLocationCommand(user.tenantId, dto.name, dto.address);
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }
}
