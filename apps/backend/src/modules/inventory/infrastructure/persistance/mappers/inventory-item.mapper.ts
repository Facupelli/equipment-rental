import { InventoryItem as PrismaInventoryItem } from 'src/generated/prisma/client';
import { InventoryItem, InventoryItemProps } from '../../../domain/entities/inventory-item.entity';
import { InventoryItemStatus } from '@repo/types';
import { Prisma } from 'src/generated/prisma/browser';
import { BlackoutPeriod } from 'src/modules/inventory/domain/entities/blackout-period.entity';

export class InventoryItemMapper {
  public static toDomain(prismaItem: PrismaInventoryItem, blackouts: BlackoutPeriod[]): InventoryItem {
    const props: InventoryItemProps = {
      id: prismaItem.id,
      tenantId: prismaItem.tenantId,
      productId: prismaItem.productId,
      locationId: prismaItem.locationId,
      ownerId: prismaItem.ownerId,
      status: prismaItem.status as InventoryItemStatus,
      totalQuantity: prismaItem.totalQuantity,
      serialNumber: prismaItem.serialNumber,
      purchaseDate: prismaItem.purchaseDate,
      purchaseCost: prismaItem.purchaseCost ? prismaItem.purchaseCost.toNumber() : null,
      blackouts,
      createdAt: prismaItem.createdAt,
      updatedAt: prismaItem.updatedAt,
    };

    return InventoryItem.reconstitute(props);
  }

  public static toPersistence(inventoryItem: InventoryItem): Prisma.InventoryItemUncheckedCreateInput {
    return {
      id: inventoryItem.Id,
      tenantId: inventoryItem.TenantId,
      productId: inventoryItem.ProductId,
      locationId: inventoryItem.LocationId,
      ownerId: inventoryItem.OwnerId,
      status: inventoryItem.Status,
      totalQuantity: inventoryItem.TotalQuantity,
      serialNumber: inventoryItem.SerialNumber,
      purchaseDate: inventoryItem.PurchaseDate,
      purchaseCost: inventoryItem.PurchaseCost,
      createdAt: inventoryItem.CreatedAt,
      updatedAt: inventoryItem.UpdatedAt,
    };
  }
}
