import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationMapper } from './location.mapper';
import { LocationResponseDto } from '@repo/schemas';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLocationDto): Promise<string> {
    return await this.locationService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<LocationResponseDto> {
    const location = await this.locationService.findById(id);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return LocationMapper.toResponse(location);
  }

  @Get()
  async findAll(): Promise<LocationResponseDto[]> {
    const locations = await this.locationService.findAll();
    return locations.map((location) => LocationMapper.toResponse(location));
  }
}
