import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { mapPostgresError } from 'src/core/utils/postgres-error.mapper';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { AssetAssignment } from 'src/modules/inventory/domain/entities/asset-assignment.entity';
import { AssetAssignmentRepositoryPort } from 'src/modules/inventory/domain/ports/asset-assignment.repository.port';

@Injectable()
export class AssetAssignmentRepository implements AssetAssignmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists a new AssetAssignment via raw SQL.
   *
   * tstzrange is unsupported by Prisma's type system — this insert must
   * be raw. The EXCLUDE constraint fires here if a concurrent request
   * already claimed this asset for an overlapping period.
   */
  async save(assignment: AssetAssignment): Promise<void> {
    const period = formatPostgresRange(assignment.period);

    try {
      await this.prisma.client.$executeRaw`
        INSERT INTO asset_assignments (
          id,
          asset_id,
          order_item_id,
          order_id,
          type,
          source,
          reason,
          period,
          created_at,
          updated_at
        ) VALUES (
          ${assignment.id}::uuid,
          ${assignment.assetId}::uuid,
          ${assignment.orderItemId}::uuid,
          ${assignment.orderId}::uuid,
          ${assignment.type}::"AssignmentType",
          ${assignment.source}::"AssignmentSource",
          ${assignment.reason},
          ${period}::tstzrange,
          now(),
          now()
        )
      `;
    } catch (error) {
      mapPostgresError(error);
    }
  }
}
