import { Injectable } from '@nestjs/common';
import { InventoryItemStatus } from '@repo/types';
import { PrismaService } from 'src/core/database/prisma.service';
import { RentalInventoryReadPort } from 'src/modules/rental/domain/ports/rental-inventory-read.port';
import { DateRange } from '../../domain/value-objects/date-range.vo';

interface QuantityRow {
  total: bigint;
}

@Injectable()
export class PrismaInventoryReadAdapter extends RentalInventoryReadPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Returns the total rentable quantity for a product by summing total_quantity
   * across all non-RETIRED inventory items belonging to that product.
   */
  async getTotalQuantity(productId: string, tenantId: string): Promise<number> {
    const result = await this.prisma.client.inventoryItem.aggregate({
      where: {
        productId,
        tenantId,
        status: { not: InventoryItemStatus.RETIRED },
      },
      _sum: { totalQuantity: true },
    });

    return result._sum.totalQuantity ?? 0;
  }

  /**
   * Returns the total quantity blocked by blackout periods for a product
   * within the given date range, summed across all its inventory items.
   */
  async getBlackedOutQuantity(productId: string, tenantId: string, range: DateRange): Promise<number> {
    const rows = await this.prisma.client.$queryRaw<QuantityRow[]>`
      SELECT COALESCE(SUM(bp.blocked_quantity), 0) AS total
      FROM blackout_periods bp
      JOIN inventory_items ii ON ii.id = bp.inventory_item_id
      WHERE ii.product_id = ${productId}
        AND bp.tenant_id = ${tenantId}
        AND ii.status != ${InventoryItemStatus.RETIRED}::"InventoryStatus"
        AND bp.blocked_period && tstzrange(${range.start}, ${range.end})
    `;

    return Number(rows[0]?.total ?? 0);
  }
}
