import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { BulkAddSchedulesToLocationCommand } from '../../application/commands/bulk-add-schedule-to-location/bulk-add-schedule-to-location.command';
import { BulkAddScheduleToLocationDto } from '../../application/commands/bulk-add-schedule-to-location/bulk-add-schedule-to-location.request.dto';
import { LocationNotFoundError } from '../../domain/errors/location.errors';

@Controller('locations')
export class BulkAddLocationSchedulesHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':locationId/schedules/bulk')
  async bulkAdd(
    @CurrentUser() user: ReqUser,
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
