import { Injectable } from '@nestjs/common';
import {
  AvailabilityRepositoryPort,
  BulkCandidate,
  ResolvedBulkCandidate,
  ResolvedSerializedCandidate,
  SerializedCandidate,
} from '../../application/ports/availability-repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { AvailabilityConflict } from '../../application/exceptions/availability.exceptions';

interface AutoAssignRow {
  id: string;
}

interface AggregateRow {
  total: bigint;
}

@Injectable()
export class AvailabilityRepository implements AvailabilityRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async autoAssign(
    candidate: SerializedCandidate,
    range: string,
    tenantId: string,
    assignedUnitIds: Set<string>,
  ): Promise<{ candidate: ResolvedSerializedCandidate } | { conflict: AvailabilityConflict }> {
    const excludedIds = [...assignedUnitIds];

    const rows = await this.prisma.client.$queryRaw<AutoAssignRow[]>`
      SELECT ii.id
      FROM inventory_items ii
      WHERE ii.tenant_id  = ${tenantId}
        AND ii.product_id = ${candidate.productId}
        AND ii.status     = 'OPERATIONAL'
        -- Exclude units already assigned in this call
        AND ii.id NOT IN (${excludedIds.length > 0 ? excludedIds : ['__none__']})
        -- No overlapping active booking
        AND NOT EXISTS (
          SELECT 1
          FROM bookings b
          WHERE b.inventory_item_id = ii.id
            AND b.tenant_id         = ${tenantId}
            AND b.booking_range    && ${range}::tstzrange
        )
        -- No overlapping blackout period
        AND NOT EXISTS (
          SELECT 1
          FROM blackout_periods bp
          WHERE bp.inventory_item_id = ii.id
            AND bp.tenant_id         = ${tenantId}
            AND bp.blocked_period   && ${range}::tstzrange
        )
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        conflict: {
          productId: candidate.productId,
          reason: 'SERIALIZED_NO_UNIT_AVAILABLE',
        },
      };
    }

    const assignedId = rows[0].id;
    assignedUnitIds.add(assignedId);

    return {
      candidate: {
        ...candidate,
        inventoryItemId: assignedId,
      },
    };
  }

  async checkPreSelectedUnit(
    candidate: SerializedCandidate & { inventoryItemId: string },
    range: string,
    tenantId: string,
  ): Promise<{ candidate: ResolvedSerializedCandidate } | { conflict: AvailabilityConflict }> {
    const [bookingConflicts, blackoutConflicts] = await Promise.all([
      this.prisma.client.$queryRaw<{ id: string }[]>`
        SELECT b.id
        FROM bookings b
        WHERE b.inventory_item_id = ${candidate.inventoryItemId}
          AND b.tenant_id         = ${tenantId}
          AND b.booking_range    && ${range}::tstzrange
        LIMIT 1
      `,
      this.prisma.client.$queryRaw<{ id: string }[]>`
        SELECT bp.id
        FROM blackout_periods bp
        WHERE bp.inventory_item_id = ${candidate.inventoryItemId}
          AND bp.tenant_id         = ${tenantId}
          AND bp.blocked_period   && ${range}::tstzrange
        LIMIT 1
      `,
    ]);

    if (bookingConflicts.length > 0 || blackoutConflicts.length > 0) {
      return {
        conflict: {
          productId: candidate.productId,
          inventoryItemId: candidate.inventoryItemId,
          reason: 'SERIALIZED_UNIT_UNAVAILABLE',
        },
      };
    }

    return { candidate: { ...candidate, inventoryItemId: candidate.inventoryItemId } };
  }

  // ---------------------------------------------------------------------------
  // BULK
  // ---------------------------------------------------------------------------

  async checkBulk(
    candidate: BulkCandidate,
    range: string,
    tenantId: string,
  ): Promise<{ candidate: ResolvedBulkCandidate } | { conflict: AvailabilityConflict }> {
    const [bookedRows, blockedRows] = await Promise.all([
      this.prisma.client.$queryRaw<AggregateRow[]>`
        SELECT COALESCE(SUM(b.quantity), 0) AS total
        FROM bookings b
        WHERE b.tenant_id  = ${tenantId}
          AND b.product_id = ${candidate.productId}
          AND b.booking_range && ${range}::tstzrange
      `,
      this.prisma.client.$queryRaw<AggregateRow[]>`
        SELECT COALESCE(SUM(bp.blocked_quantity), 0) AS total
        FROM blackout_periods bp
        WHERE bp.tenant_id  = ${tenantId}
          AND bp.product_id = ${candidate.productId}
          AND bp.blocked_period && ${range}::tstzrange
      `,
    ]);

    const bookedQty = Number(bookedRows[0].total);
    const blockedQty = Number(blockedRows[0].total);
    const available = candidate.totalStock - bookedQty - blockedQty;

    if (available < candidate.quantity) {
      return {
        conflict: {
          productId: candidate.productId,
          reason: 'BULK_INSUFFICIENT_STOCK',
          requested: candidate.quantity,
          available: Math.max(0, available),
        },
      };
    }

    return { candidate };
  }
}
