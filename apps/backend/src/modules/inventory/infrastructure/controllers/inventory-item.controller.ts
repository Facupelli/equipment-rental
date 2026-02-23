import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InventoryItemService } from '../../application/inventory-item.service';
import { CreateInventoryItemDto } from '../../application/dto/create-inventory-item.dto';
import { CreateBlackoutPeriodDto } from '../../application/dto/create-blackout-period.dto';
import { CreateBlackoutPeriodCommand } from '../../application/create-blackout-period.command';

@Controller('inventory-item')
export class InventoryItemController {
  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly createBlackoutPeriodCommand: CreateBlackoutPeriodCommand,
  ) {}

  @Post()
  async create(@Body() dto: CreateInventoryItemDto) {
    return await this.inventoryItemService.save(dto);
  }

  @Post('blackout-period')
  async createBlackoutPeriod(@Body() dto: CreateBlackoutPeriodDto) {
    console.log({ dto });
    return await this.createBlackoutPeriodCommand.execute(dto);
  }

  @Get()
  async getAll() {
    return await this.inventoryItemService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.inventoryItemService.findById(id);
  }
}
