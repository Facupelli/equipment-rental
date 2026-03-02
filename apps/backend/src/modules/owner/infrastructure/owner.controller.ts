import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { OwnerResponseDto } from '@repo/schemas';
import { OwnerService } from '../owner.service';
import { CreateOwnerDto } from '../application/dto/create-owner.dto';
import { OwnerMapper } from './owner.mapper';

@Controller('owners')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOwnerDto): Promise<string> {
    return await this.ownerService.create(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<OwnerResponseDto> {
    const owner = await this.ownerService.findById(id);

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return OwnerMapper.toResponse(owner);
  }

  @Get()
  async findAll(): Promise<OwnerResponseDto[]> {
    const owners = await this.ownerService.findAll();
    return owners.map((owner) => OwnerMapper.toResponse(owner));
  }
}
