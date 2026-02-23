import { Body, Controller, Get, Post } from '@nestjs/common';
import { InventoryItemService } from '../../application/inventory-item.service';
import { CreateInventoryItemDto } from '../../application/dto/create-inventory-item.dto';

@Controller('inventory-item')
export class InventoryItemController {
  constructor(private readonly inventoryItemService: InventoryItemService) {}

  @Post()
  async create(@Body() dto: CreateInventoryItemDto) {
    return await this.inventoryItemService.save(dto);
  }

  @Get()
  async getAll() {
    return await this.inventoryItemService.findAll();
  }
}
