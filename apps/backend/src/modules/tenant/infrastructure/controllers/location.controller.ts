import { Body, Controller, Get, Post } from '@nestjs/common';
import { GetLocationsQuery } from '../../application/queries/get-locations/get-locations.query';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLocationCommand } from '../../application/commands/create-location/create-location.command';
import { CreateLocationDto } from '../../application/dto/create-location.dto';

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
}
