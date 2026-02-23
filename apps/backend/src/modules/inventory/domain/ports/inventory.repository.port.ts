import { InventoryItem } from '../entities/inventory-item.entity';

export abstract class InventoryItemRepositoryPort {
  abstract findById(id: string): Promise<InventoryItem | null>;
  abstract findAll(): Promise<InventoryItem[]>;
  abstract save(inventoryItem: InventoryItem): Promise<string>;
}
