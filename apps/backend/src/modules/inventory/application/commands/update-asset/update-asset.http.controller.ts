import { Body, ConflictException, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  AssetNotFoundError,
  DuplicateSerialNumberError,
  ProductTypeNotFoundError,
  SerialNumberRequiredError,
} from 'src/modules/inventory/domain/errors/inventory.errors';

import { UpdateAssetCommand } from './update-asset.command';
import { UpdateAssetRequestDto } from './update-asset.request.dto';

@StaffRoute(Permission.UPDATE_ASSETS)
@Controller('assets')
export class UpdateAssetHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssetRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateAssetCommand(user.tenantId, id, {
        locationId: dto.locationId,
        ownerId: dto.ownerId,
        serialNumber: dto.serialNumber,
        notes: dto.notes,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof AssetNotFoundError || error instanceof ProductTypeNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof DuplicateSerialNumberError || error instanceof SerialNumberRequiredError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
