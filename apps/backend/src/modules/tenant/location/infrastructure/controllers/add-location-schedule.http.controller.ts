import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { Permission } from '@repo/types';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { AddScheduleToLocationCommand } from '../../application/commands/add-schedule-to-location/add-schedule-to-location.command';
import { AddScheduleToLocationDto } from '../../application/commands/add-schedule-to-location/add-schedule-to-location.request.dto';
import { LocationNotFoundError } from '../../domain/errors/location.errors';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('locations')
export class AddLocationScheduleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':locationId/schedules')
  async createSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
    @Body() dto: AddScheduleToLocationDto,
  ): Promise<void> {
    const command = new AddScheduleToLocationCommand({
      tenantId: user.tenantId,
      locationId,
      type: dto.type,
      dayOfWeek: dto.dayOfWeek,
      specificDate: dto.specificDate ? new Date(dto.specificDate) : null,
      openTime: dto.openTime,
      closeTime: dto.closeTime,
      slotIntervalMinutes: dto.slotIntervalMinutes,
    });

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
