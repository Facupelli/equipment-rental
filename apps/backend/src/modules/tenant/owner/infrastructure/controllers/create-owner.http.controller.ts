import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CreateOwnerCommand } from '../../application/commands/create-owner/create-owner.command';
import { CreateOwnerDto } from '../../application/commands/create-owner/create-owner.request.dto';

@StaffRoute(Permission.MANAGE_OWNERS)
@Controller('owners')
export class CreateOwnerHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createOwner(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOwnerDto): Promise<string> {
    const command = new CreateOwnerCommand(user.tenantId, dto.name, dto.email, dto.phone, dto.notes);
    return this.commandBus.execute(command);
  }
}
