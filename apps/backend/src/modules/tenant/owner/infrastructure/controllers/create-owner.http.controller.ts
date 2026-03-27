import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { CreateOwnerCommand } from '../../application/commands/create-owner/create-owner.command';
import { CreateOwnerDto } from '../../application/commands/create-owner/create-owner.request.dto';

@Controller('owners')
export class CreateOwnerHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createOwner(@CurrentUser() user: ReqUser, @Body() dto: CreateOwnerDto): Promise<string> {
    const command = new CreateOwnerCommand(user.tenantId, dto.name, dto.email, dto.phone, dto.notes);
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }
}
