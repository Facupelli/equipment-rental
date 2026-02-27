import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service'; // Assuming you have a global Prisma service
import { InventoryItemRepositoryPort } from '../../domain/ports/inventory.repository.port';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryItemMapper } from './mappers/inventory-item.mapper';
import { BlackoutPeriodMapper, BlackoutPeriodRawRecord } from './mappers/blackout-period.mapper';

@Injectable()
export class PrismaInventoryItemRepository extends InventoryItemRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const item = await this.prisma.client.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    const rawBlackouts = await this.prisma.client.$queryRaw<BlackoutPeriodRawRecord[]>`
    SELECT
      id,
      tenant_id,
      inventory_item_id,
      reason,
      blocked_period::text,
      created_at,
      updated_at
    FROM blackout_periods
    WHERE inventory_item_id = ${id}
  `;

    const blackouts = rawBlackouts.map(BlackoutPeriodMapper.toDomain);

    return InventoryItemMapper.toDomain(item, blackouts);
  }

  async save(item: InventoryItem): Promise<string> {
    const persistenceData = InventoryItemMapper.toPersistence(item);
    const newBlackouts = item.NewBlackouts;

    const result = await this.prisma.client.$transaction(async (tx) => {
      const item = await tx.inventoryItem.upsert({
        where: { id: persistenceData.id },
        create: persistenceData,
        update: {
          locationId: persistenceData.locationId,
          ownerId: persistenceData.ownerId,
          status: persistenceData.status,
          totalQuantity: persistenceData.totalQuantity,
          purchaseCost: persistenceData.purchaseCost,
          updatedAt: persistenceData.updatedAt,
        },
      });

      for (const blackout of newBlackouts) {
        const data = BlackoutPeriodMapper.toPersistence(blackout);

        await tx.$executeRaw`
          INSERT INTO blackout_periods (
            id,
            tenant_id,
            inventory_item_id,
            reason,
            blocked_period,
            created_at,
            updated_at
          ) VALUES (
            ${data.id},
            ${data.tenant_id},
            ${data.inventory_item_id},
            ${data.reason},
            tstzrange(${data.blockedPeriodStart}::timestamptz, ${data.blockedPeriodEnd}::timestamptz),
            ${data.created_at},
            ${data.updated_at}
          )
        `;
      }

      return item.id;
    });

    return result;
  }
}
