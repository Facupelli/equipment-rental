import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetOwnersQuery } from '../../presentation/queries/get-owners/get-owners.query-handler';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOwnerCommand } from '../../application/commands/create-owner/create-owner.command';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateOwnerDto } from '../../application/dto/create-owner.dto';
import { CreateOwnerContractDto } from '../../application/dto/create-owner-contract.dto';
import { CreateOwnerContractCommand } from '../../application/commands/create-owner-contract/create-owner-contract.command';

@Controller('owners')
export class OwnerController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async createOwner(@CurrentUser() user: ReqUser, @Body() dto: CreateOwnerDto): Promise<string> {
    const command = new CreateOwnerCommand(user.tenantId, dto.name, dto.email, dto.phone, dto.notes);

    return await this.commandBus.execute(command);
  }

  @Post(':ownerId/contracts')
  async createOwnerContract(
    @CurrentUser() user: ReqUser,
    @Param('ownerId') ownerId: string,
    @Body() dto: CreateOwnerContractDto,
  ): Promise<string> {
    const command = new CreateOwnerContractCommand(
      user.tenantId,
      ownerId,
      dto.assetId ?? null,
      dto.ownerShare,
      dto.rentalShare,
      dto.basis,
      dto.validFrom,
      dto.validUntil ?? null,
      dto.notes ?? null,
    );

    return await this.commandBus.execute(command);
  }

  @Get()
  async getOwners() {
    return await this.queryBus.execute(new GetOwnersQuery());
  }
}
