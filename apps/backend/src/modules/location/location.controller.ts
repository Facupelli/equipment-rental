import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from '@repo/schemas';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLocationDto) {
    return await this.locationService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.locationService.findById(id);
  }

  @Get()
  async findAll() {
    return await this.locationService.findAll();
  }
}
