import { randomUUID } from 'node:crypto';
import { InventoryItemRepositoryPort } from '../domain/ports/inventory.repository.port';
import { DateRange } from '../domain/value-objects/date-range.vo';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlackoutPeriodDto } from './dto/create-blackout-period.dto';

@Injectable()
export class CreateBlackoutPeriodCommand {
  constructor(private readonly inventoryItemRepository: InventoryItemRepositoryPort) {}

  async execute(dto: CreateBlackoutPeriodDto): Promise<string> {
    console.log('EXECUTE');
    const item = await this.inventoryItemRepository.findById(dto.inventoryItemId);

    if (!item) {
      throw new NotFoundException(`InventoryItem not found: ${dto.inventoryItemId}`);
    }

    console.log({ item });

    const blockedPeriod = DateRange.create(dto.startDate, dto.endDate);

    item.addBlackout({
      id: randomUUID(),
      reason: dto.reason,
      blockedPeriod,
    });

    const itemId = await this.inventoryItemRepository.save(item);
    return itemId;
  }
}
