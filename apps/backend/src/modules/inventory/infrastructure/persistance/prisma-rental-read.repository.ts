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

  /**
   * Returns IDs of inventory items that are free to book for the requested range,
   * ranked by all-time booking count descending (bin-packing strategy).
   *
   * Bin-packing rationale: preferring the most-used items keeps lightly-used
   * items available for future bookings, minimising fleet fragmentation.
   *
   * An item is considered free when it has:
   *   - No confirmed booking (RESERVED or ACTIVE) whose rental_period overlaps
   *     the requested range
   *   - No blackout period whose blocked_period overlaps the requested range
   *
   * Only applies to SERIALIZED products — BULK availability is quantity-based
   * and does not require item-level candidate resolution.
   */
  async getCandidateItemIds(productId: string, tenantId: string, range: DateRange): Promise<string[]> {
    interface CandidateRow {
      id: string;
    }

    const rows = await this.prisma.client.$queryRaw<CandidateRow[]>`
      SELECT ii.id
      FROM inventory_items ii
      LEFT JOIN booking_line_items bli ON bli.inventory_item_id = ii.id
      WHERE ii.product_id = ${productId}
        AND ii.tenant_id  = ${tenantId}
        AND ii.status     != ${InventoryItemStatus.RETIRED}::"InventoryStatus"

        -- Exclude items with a confirmed booking overlapping the requested range
        AND NOT EXISTS (
          SELECT 1
          FROM booking_line_items b2
          JOIN bookings bk ON bk.id = b2.booking_id
          WHERE b2.inventory_item_id = ii.id
            AND bk.status IN ('RESERVED', 'ACTIVE')
            AND bk.rental_period && tstzrange(${range.start}, ${range.end})
        )

        -- Exclude items blocked by a blackout period overlapping the requested range
        AND NOT EXISTS (
          SELECT 1
          FROM blackout_periods bp
          WHERE bp.inventory_item_id = ii.id
            AND bp.blocked_period && tstzrange(${range.start}, ${range.end})
        )

      GROUP BY ii.id
      ORDER BY COUNT(bli.id) DESC
    `;

    return rows.map((row) => row.id);
  }
}
