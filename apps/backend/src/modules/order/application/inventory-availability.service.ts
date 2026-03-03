import { Injectable } from '@nestjs/common';
import { BlackoutConflict, InventoryAvailabilityPort, SerializedItemRef } from './ports/inventory-availability.port';
import { PrismaService } from 'src/core/database/prisma.service';

interface BlackoutPeriodRow {
  id: string;
  reason: string;
}

interface BlockedQuantityRow {
  id: string;
  reason: string;
  blocked_quantity: number;
}

@Injectable()
export class InventoryAvailabilityService implements InventoryAvailabilityPort {
  constructor(private readonly prisma: PrismaService) {}

  async getBlackoutsForItem(inventoryItemId: string, range: string, tenantId: string): Promise<BlackoutConflict[]> {
    const rows = await this.prisma.client.$queryRaw<BlackoutPeriodRow[]>`
      SELECT id, reason
      FROM blackout_periods
      WHERE tenant_id        = ${tenantId}
        AND inventory_item_id = ${inventoryItemId}
        AND blocked_period   && ${range}::tstzrange
    `;

    return rows.map((row) => ({ blackoutId: row.id, reason: row.reason }));
  }

  async getBlackoutsForProduct(
    productId: string,
    range: string,
    tenantId: string,
  ): Promise<{ conflicts: BlackoutConflict[]; blockedQuantity: number }> {
    const rows = await this.prisma.client.$queryRaw<BlockedQuantityRow[]>`
      SELECT id, reason, blocked_quantity
      FROM blackout_periods
      WHERE tenant_id      = ${tenantId}
        AND product_id     = ${productId}
        AND blocked_period && ${range}::tstzrange
    `;

    const conflicts: BlackoutConflict[] = rows.map((row) => ({
      blackoutId: row.id,
      reason: row.reason,
    }));

    const blockedQuantity = rows.reduce((sum, row) => sum + Number(row.blocked_quantity), 0);

    return { conflicts, blockedQuantity };
  }

  async getSerializedItemsForProduct(productId: string, tenantId: string): Promise<SerializedItemRef[]> {
    const items = await this.prisma.client.inventoryItem.findMany({
      where: { productId, tenantId },
      select: { id: true, status: true },
    });

    return items;
  }

  async getBulkProductStock(productId: string, tenantId: string): Promise<number> {
    const product = await this.prisma.client.product.findFirstOrThrow({
      where: { id: productId, tenantId },
      select: { totalStock: true },
    });

    if (!product.totalStock) {
      throw new Error(`Product totalStock is null. This should never happen.`);
    }

    return product.totalStock;
  }
}
