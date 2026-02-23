import { Injectable } from '@nestjs/common';
import { InventoryItemRepositoryPort } from '../domain/ports/inventory.repository.port';

@Injectable()
export class InventoryItemService {
  constructor(private readonly inventoryItemRepository: InventoryItemRepositoryPort) {}

  async findById(id: string): Promise<any> {
    return await this.inventoryItemRepository.findById(id);
  }

  async findAll(): Promise<any> {
    return await this.inventoryItemRepository.findAll();
  }

  async save(item: any): Promise<string> {
    return await this.inventoryItemRepository.save(item);
  }
}
