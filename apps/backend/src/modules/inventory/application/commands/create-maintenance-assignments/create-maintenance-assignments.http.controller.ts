import { Body, ConflictException, Controller, Post, UnprocessableEntityException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  AssetAssignmentConflictError,
  InvalidAssetSelectionError,
} from 'src/modules/inventory/domain/errors/inventory.errors';

import { CreateMaintenanceAssignmentsCommand } from './create-maintenance-assignments.command';
import { CreateMaintenanceAssignmentsRequestDto } from './create-maintenance-assignments.request.dto';
import { CreateMaintenanceAssignmentsResponseDto } from './create-maintenance-assignments.response.dto';

@StaffRoute(Permission.MANAGE_ASSET_ASSIGNMENTS)
@Controller('asset-assignments/maintenance')
export class CreateMaintenanceAssignmentsHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMaintenanceAssignmentsRequestDto,
  ): Promise<CreateMaintenanceAssignmentsResponseDto> {
    const result = await this.commandBus.execute(
      new CreateMaintenanceAssignmentsCommand(
        user.tenantId,
        dto.assetIds,
        DateRange.create(dto.startDate, dto.endDate),
        dto.reason ?? null,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof InvalidAssetSelectionError) {
        throw new UnprocessableEntityException({
          message: error.message,
          assetIds: error.assetIds,
        });
      }

      if (error instanceof AssetAssignmentConflictError) {
        throw new ConflictException({
          message: error.message,
          assetIds: error.assetIds,
        });
      }

      throw error;
    }

    return { createdCount: result.value.createdCount };
  }
}
