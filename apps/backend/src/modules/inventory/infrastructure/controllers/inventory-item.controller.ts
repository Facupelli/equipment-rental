import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InventoryItemService } from '../../application/inventory-item.service';
import { CreateInventoryItemDto } from '../../application/dto/create-inventory-item.dto';
import { CreateBlackoutPeriodDto } from '../../application/dto/create-blackout-period.dto';
import { CreateBlackoutPeriodCommand } from '../../application/create-blackout-period.command';
import { InventoryItemListItemDto, PaginatedDto } from '@repo/schemas';
import { GetInventoryItemsQueryDto } from '../../application/dto/items/get-item-list-query.dto';
import { Paginated } from 'src/core/decorators/paginated-response.decorator';

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
  @Paginated()
  async getAll(@Query() filters: GetInventoryItemsQueryDto): Promise<PaginatedDto<InventoryItemListItemDto>> {
    return await this.inventoryItemService.findAll(filters);
  }

  // @Get(':id')
  // async getById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
  //   const item = await this.inventoryItemService.findById(id);

  // }
}
