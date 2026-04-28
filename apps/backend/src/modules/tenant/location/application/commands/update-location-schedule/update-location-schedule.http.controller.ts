import { Body, ConflictException, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import { LocationNotFoundError, LocationScheduleNotFoundError } from '../../../domain/errors/location.errors';
import { LocationScheduleOverlapException } from '../../../domain/exceptions/location-schedule.exceptions';

import { UpdateLocationScheduleCommand } from './update-location-schedule.command';
import { UpdateLocationScheduleRequestDto } from './update-location-schedule.request.dto';

@StaffRoute(Permission.MANAGE_LOCATIONS)
@Controller('locations')
export class UpdateLocationScheduleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':locationId/schedules/:scheduleId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateLocationScheduleRequestDto,
  ): Promise<void> {
    const command = new UpdateLocationScheduleCommand({
      tenantId: user.tenantId,
      locationId,
      scheduleId,
      openTime: dto.openTime,
      closeTime: dto.closeTime,
      slotIntervalMinutes: dto.slotIntervalMinutes,
    });

    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof LocationNotFoundError || error instanceof LocationScheduleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof LocationScheduleOverlapException) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
