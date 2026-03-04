import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetOwnersQuery } from '../../application/queries/get-owners/get-owners.query-handler';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { OwnerCreate } from '@repo/schemas';
import { CreateOwnerCommand } from '../../application/commands/create-owner/create-owner.command';

@Controller('owners')
export class OwnerController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async createOwner(@Body() dto: OwnerCreate): Promise<string> {
    const command = new CreateOwnerCommand(dto.name, dto.email, dto.phone, dto.notes);

    return await this.commandBus.execute(command);
  }

  @Get()
  async getOwners() {
    return await this.queryBus.execute(new GetOwnersQuery());
  }
}
