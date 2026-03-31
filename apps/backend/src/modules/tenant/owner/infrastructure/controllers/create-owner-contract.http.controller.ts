import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, ConflictException, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { CreateOwnerContractCommand } from '../../application/commands/create-owner-contract/create-owner-contract.command';
import { CreateOwnerContractDto } from '../../application/commands/create-owner-contract/create-owner-contract.request.dto';
import {
  AssetNotFoundError,
  AssetNotOwnedByOwnerError,
  OverlappingContractError,
  OwnerNotFoundError,
} from '../../domain/errors/owner-contract.errors';

@StaffRoute(Permission.MANAGE_OWNERS)
@Controller('owners')
export class CreateOwnerContractHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':ownerId/contracts')
  async createOwnerContract(
    @CurrentUser() user: AuthenticatedUser,
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
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof OwnerNotFoundError || error instanceof AssetNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof AssetNotOwnedByOwnerError || error instanceof OverlappingContractError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    return result.value;
  }
}
