import { InventoryItem } from '../entities/inventory-item.entity';

export abstract class InventoryItemRepositoryPort {
  abstract findById(id: string): Promise<InventoryItem | null>;
  abstract save(inventoryItem: InventoryItem): Promise<string>;
}
