import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { InventoryItemService } from '../../application/inventory-item.service';
import { CreateInventoryItemDto } from '../../application/dto/create-inventory-item.dto';
import { CreateBlackoutPeriodDto } from '../../application/dto/create-blackout-period.dto';
import { CreateBlackoutPeriodCommand } from '../../application/create-blackout-period.command';
import { InventoryItemMapper } from '../persistance/mappers/inventory-item.mapper';
import { InventoryItemResponseDto } from '@repo/schemas';

@Controller('inventory-items')
export class InventoryItemController {
  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly createBlackoutPeriodCommand: CreateBlackoutPeriodCommand,
  ) {}

  @Post()
  async create(@Body() dto: CreateInventoryItemDto): Promise<string> {
    return await this.inventoryItemService.save(dto);
  }

  @Post('blackout-period')
  async createBlackoutPeriod(@Body() dto: CreateBlackoutPeriodDto): Promise<string> {
    return await this.createBlackoutPeriodCommand.execute(dto);
  }

  @Get()
  async getAll(): Promise<InventoryItemResponseDto[]> {
    const items = await this.inventoryItemService.findAll();
    return items.map((item) => InventoryItemMapper.toResponse(item));
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    const item = await this.inventoryItemService.findById(id);

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return InventoryItemMapper.toResponse(item);
  }
}
