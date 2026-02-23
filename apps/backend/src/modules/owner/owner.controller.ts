import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { CreateOwnerDto } from './dto/create-owner.dto';

@Controller('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOwnerDto) {
    return await this.ownerService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.ownerService.findById(id);
  }

  @Get()
  async findAll() {
    return await this.ownerService.findAll();
  }
}
