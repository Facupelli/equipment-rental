import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { BulkAddSchedulesToLocationCommand } from './bulk-add-schedule-to-location.command';
import { BulkAddScheduleToLocationDto } from './bulk-add-schedule-to-location.request.dto';
import { LocationNotFoundError } from '../../../domain/errors/location.errors';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('locations')
export class BulkAddLocationSchedulesHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':locationId/schedules/bulk')
  async bulkAdd(
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
    @Body() dto: BulkAddScheduleToLocationDto,
  ): Promise<void> {
    const command = new BulkAddSchedulesToLocationCommand(
      user.tenantId,
      locationId,
      dto.items.map((item) => ({
        locationId,
        type: item.type,
        dayOfWeek: item.dayOfWeek,
        specificDate: item.specificDate ? new Date(item.specificDate) : null,
        window: {
          openTime: item.openTime,
          closeTime: item.closeTime,
          slotIntervalMinutes: item.slotIntervalMinutes,
        },
      })),
    );

    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof LocationNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
