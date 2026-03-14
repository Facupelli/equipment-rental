import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { GetLocationsQuery } from '../../application/queries/get-locations/get-locations.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLocationCommand } from '../../application/commands/create-location/create-location.command';
import { CreateLocationDto } from '../../application/dto/create-location.dto';
import {
  AddScheduleToLocationDto,
  BulkAddScheduleToLocationDto,
} from '../../application/dto/add-schedule-to-location.dto';
import { AddScheduleToLocationCommand } from '../../application/commands/add-schedule-to-location/add-schedule-to-location.command';
import { LocationNotFoundError } from '../../domain/exceptions/location.exceptions';
import { ScheduleSlotType } from '@repo/types';
import { GetLocationScheduleSlotsQuery } from '../../application/queries/get-location-schedule-slots/get-location-schedule-slots.query';
import { GetLocationScheduleSlotsQueryDto } from '../../application/dto/get-location-schedule-slots-query.dto';
import { GetLocationSchedulesQuery } from '../../application/queries/get-location-schedules/get-location-schedules.query';
import { BulkAddSchedulesToLocationCommand } from '../../application/commands/bulk-add-schedule-to-location/bulk-add-schedule-to-location.command';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

@Controller('locations')
export class LocationController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async createLocation(@CurrentUser() user: ReqUser, @Body() dto: CreateLocationDto): Promise<string> {
    const command = new CreateLocationCommand(user.tenantId, dto.name, dto.address);

    return await this.commandBus.execute(command);
  }

  @Get()
  async getLocations() {
    return await this.queryBus.execute(new GetLocationsQuery());
  }

  @Get(':locationId/slots')
  async getLocationScheduleSlots(
    @Param('locationId') locationId: string,
    @Query() query: GetLocationScheduleSlotsQueryDto,
  ): Promise<number[]> {
    if (isNaN(query.date.getTime())) {
      throw new BadRequestException('Invalid date format. Expected ISO 8601 date string (e.g. 2026-03-13).');
    }

    if (query.type !== ScheduleSlotType.PICKUP && query.type !== ScheduleSlotType.RETURN) {
      throw new BadRequestException(`Invalid type. Expected ${ScheduleSlotType.PICKUP} or ${ScheduleSlotType.RETURN}.`);
    }

    return this.queryBus.execute(new GetLocationScheduleSlotsQuery(locationId, query.date, query.type));
  }

  @Get(':locationId/schedules')
  async getLocationSchedules(@Param('locationId') locationId: string) {
    return this.queryBus.execute(new GetLocationSchedulesQuery(locationId));
  }

  @Post(':locationId/schedules')
  async createSchedule(@Param('locationId') locationId: string, @Body() dto: AddScheduleToLocationDto): Promise<void> {
    const command = new AddScheduleToLocationCommand({
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

  @Post(':locationId/schedules/bulk')
  async bulkAdd(@Param('locationId') locationId: string, @Body() dto: BulkAddScheduleToLocationDto): Promise<void> {
    const command = new BulkAddSchedulesToLocationCommand(
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
