import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { GetLocationsQuery } from '../../application/queries/get-locations/get-locations.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLocationCommand } from '../../application/commands/create-location/create-location.command';
import { CreateLocationDto } from '../../application/dto/create-location.dto';
import { AddScheduleToLocationDto } from '../../application/dto/add-schedule-to-location.dto';
import { AddScheduleToLocationCommand } from '../../application/commands/add-schedule-to-location/add-schedule-to-location.command';
import { LocationNotFoundError } from '../../domain/exceptions/location.exceptions';

@Controller('locations')
export class LocationController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async createLocation(@Body() dto: CreateLocationDto): Promise<string> {
    const command = new CreateLocationCommand(dto.name, dto.address);

    return await this.commandBus.execute(command);
  }

  @Get()
  async getLocations() {
    return await this.queryBus.execute(new GetLocationsQuery());
  }

  @Post(':locationId/schedules')
  async execute(@Param('locationId') locationId: string, @Body() dto: AddScheduleToLocationDto): Promise<void> {
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
}
