import { Injectable } from '@nestjs/common';
import { AssignmentType } from '@repo/types';
import { Result, err, ok } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { PostgresExclusionViolationError } from 'src/core/utils/postgres-error.mapper';
import { AssetAssignment } from 'src/modules/inventory/domain/entities/asset-assignment.entity';
import {
  AssetAssignmentConflictError,
  InvalidAssetSelectionError,
} from 'src/modules/inventory/domain/errors/inventory.errors';
import { AssetAssignmentRepository } from 'src/modules/inventory/infrastructure/persistence/repositories/asset-assignment.repository';
import { AssetRepository } from 'src/modules/inventory/infrastructure/persistence/repositories/asset.repository';

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
    private readonly assetRepository: AssetRepository,
  ) {}

  async execute(params: SaveInternalAssetAssignmentsParams): Promise<SaveInternalAssetAssignmentsResult> {
    const duplicateIds = this.findDuplicateIds(params.assetIds);
    const uniqueAssetIds = [...new Set(params.assetIds)];

    const assets = await Promise.all(
      uniqueAssetIds.map((assetId) => this.assetRepository.load(assetId, params.tenantId)),
    );

    const missingIds = uniqueAssetIds.filter((_, index) => !assets[index]);
    const invalidSelectionIds = [...new Set([...duplicateIds, ...missingIds])];

    if (invalidSelectionIds.length > 0) {
      return err(new InvalidAssetSelectionError(invalidSelectionIds));
    }

    const conflictingAssetIds = assets
      .filter((asset) => asset !== null && !asset.isAvailableFor(params.period))
      .map((asset) => asset!.id);

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

          try {
            await this.assignmentRepository.save(assignment, tx);
          } catch (error) {
            if (error instanceof PostgresExclusionViolationError) {
              throw new AssetAssignmentConflictError([assetId]);
            }

            throw error;
          }
        }
      });
    } catch (error) {
      if (error instanceof AssetAssignmentConflictError) {
        return err(error);
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
}
