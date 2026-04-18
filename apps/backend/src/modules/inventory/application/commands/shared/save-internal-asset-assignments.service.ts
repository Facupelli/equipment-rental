import { Injectable } from '@nestjs/common';
import { AssignmentType } from '@repo/types';
import { Result, err, ok } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { PostgresExclusionViolationError } from 'src/core/utils/postgres-error.mapper';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { AssetAssignment } from 'src/modules/inventory/domain/entities/asset-assignment.entity';
import {
  AssetAssignmentConflictError,
  InvalidAssetSelectionError,
} from 'src/modules/inventory/domain/errors/inventory.errors';
import { AssetAssignmentRepository } from 'src/modules/inventory/infrastructure/persistence/repositories/asset-assignment.repository';
import { Prisma } from 'src/generated/prisma/client';

type InternalAssignmentType = AssignmentType.BLACKOUT | AssignmentType.MAINTENANCE;

type SaveInternalAssetAssignmentsParams = {
  tenantId: string;
  assetIds: string[];
  period: DateRange;
  type: InternalAssignmentType;
  reason: string | null;
};

export type SaveInternalAssetAssignmentsResult = Result<
  { createdCount: number },
  InvalidAssetSelectionError | AssetAssignmentConflictError
>;

@Injectable()
export class SaveInternalAssetAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignmentRepository: AssetAssignmentRepository,
  ) {}

  async execute(params: SaveInternalAssetAssignmentsParams): Promise<SaveInternalAssetAssignmentsResult> {
    const duplicateIds = this.findDuplicateIds(params.assetIds);
    const uniqueAssetIds = [...new Set(params.assetIds)];

    const selectedAssets = await this.prisma.client.asset.findMany({
      where: {
        id: { in: uniqueAssetIds },
        deletedAt: null,
        location: {
          tenantId: params.tenantId,
        },
      },
      select: {
        id: true,
      },
    });

    const selectedAssetIds = new Set(selectedAssets.map((asset) => asset.id));
    const missingIds = uniqueAssetIds.filter((assetId) => !selectedAssetIds.has(assetId));
    const invalidSelectionIds = [...new Set([...duplicateIds, ...missingIds])];

    if (invalidSelectionIds.length > 0) {
      return err(new InvalidAssetSelectionError(invalidSelectionIds));
    }

    const conflictingAssetIds = await this.findConflictingAssetIds(uniqueAssetIds, params.period);
    if (conflictingAssetIds.length > 0) {
      return err(new AssetAssignmentConflictError(conflictingAssetIds));
    }

    try {
      await this.prisma.client.$transaction(async (tx) => {
        for (const assetId of uniqueAssetIds) {
          const assignment = AssetAssignment.create({
            assetId,
            period: params.period,
            type: params.type,
            reason: params.reason ?? undefined,
          });

          await this.assignmentRepository.save(assignment, tx);
        }
      });
    } catch (error) {
      if (error instanceof PostgresExclusionViolationError) {
        const racedConflictIds = await this.findConflictingAssetIds(uniqueAssetIds, params.period);
        return err(new AssetAssignmentConflictError(racedConflictIds.length > 0 ? racedConflictIds : uniqueAssetIds));
      }

      throw error;
    }

    return ok({ createdCount: uniqueAssetIds.length });
  }

  private findDuplicateIds(assetIds: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const assetId of assetIds) {
      if (seen.has(assetId)) {
        duplicates.add(assetId);
        continue;
      }

      seen.add(assetId);
    }

    return [...duplicates];
  }

  private async findConflictingAssetIds(assetIds: string[], period: DateRange): Promise<string[]> {
    if (assetIds.length === 0) {
      return [];
    }

    const tstzrange = formatPostgresRange(period);
    const uuidList = Prisma.join(assetIds.map((assetId) => Prisma.sql`${assetId}::uuid`));

    const rows = await this.prisma.client.$queryRaw<{ assetId: string }[]>`
      SELECT DISTINCT aa.asset_id AS "assetId"
      FROM asset_assignments aa
      WHERE aa.asset_id IN (${uuidList})
        AND aa.period && ${tstzrange}::tstzrange
    `;

    return rows.map((row) => row.assetId);
  }
}
