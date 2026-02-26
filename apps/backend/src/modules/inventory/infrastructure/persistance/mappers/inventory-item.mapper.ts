import { InventoryItem as PrismaInventoryItem } from 'src/generated/prisma/client';
import { InventoryItem, InventoryItemProps } from '../../../domain/entities/inventory-item.entity';
import { InventoryItemStatus } from '@repo/types';
import { Prisma } from 'src/generated/prisma/browser';
import { BlackoutPeriod } from 'src/modules/inventory/domain/entities/blackout-period.entity';
import { BlackoutPeriodResponseDto, InventoryItemResponseDto } from '@repo/schemas';

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

  public static toResponse(entity: InventoryItem): InventoryItemResponseDto {
    return {
      id: entity.Id,
      productId: entity.ProductId,
      locationId: entity.LocationId,
      ownerId: entity.OwnerId,
      status: entity.Status,
      totalQuantity: entity.TotalQuantity,
      serialNumber: entity.SerialNumber,
      purchaseDate: entity.PurchaseDate?.toISOString() ?? null,
      purchaseCost: entity.PurchaseCost,
      blackouts: entity.Blackouts.map(InventoryItemMapper.blackoutToResponse),
      createdAt: entity.CreatedAt.toISOString(),
      updatedAt: entity.UpdatedAt.toISOString(),
    };
  }

  private static blackoutToResponse(blackout: BlackoutPeriod): BlackoutPeriodResponseDto {
    const period = blackout.blockedPeriod;

    return {
      id: blackout.id,
      reason: blackout.reason,
      blockedPeriod: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      createdAt: blackout.createdAt.toISOString(),
    };
  }
}
