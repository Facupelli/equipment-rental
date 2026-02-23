import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { InventoryItemRepositoryPort } from '../../domain/ports/inventory.repository.port';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryItemMapper } from './inventory-item.mapper';

@Injectable()
export class PrismaInventoryItemRepository implements InventoryItemRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<InventoryItem | null> {
    const item = await this.prisma.client.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return InventoryItemMapper.toDomain(item);
  }

  async findAll(): Promise<InventoryItem[]> {
    const items = await this.prisma.client.inventoryItem.findMany();
    return items.map((item) => InventoryItemMapper.toDomain(item));
  }

  async save(item: InventoryItem): Promise<string> {
    const persistenceModel = InventoryItemMapper.toPersistence(item);

    const createdProduct = await this.prisma.client.inventoryItem.create({
      data: persistenceModel,
    });

    return createdProduct.id;
  }
}
