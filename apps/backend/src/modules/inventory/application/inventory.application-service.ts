import { Injectable } from '@nestjs/common';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { AssetAssignment } from '../domain/entities/asset-assignment.entity';
import { InventoryPublicApi } from '../inventory.public-api';
import { AssetNotAvailableError } from '../domain/errors/inventory.errors';
import { err, ok, Result } from 'src/core/result';
import { PostgresExclusionViolationError } from 'src/core/utils/postgres-error.mapper';
import { AssetAvailabilityService, FindAvailableParams } from '../infrastructure/services/asset-availability.service';
import { AssetAssignmentRepository } from '../infrastructure/persistance/repositories/asset-assignment.repository';

@Injectable()
export class InventoryApplicationService implements InventoryPublicApi {
  constructor(
    private readonly assignmentRepo: AssetAssignmentRepository,
    private readonly availabilityService: AssetAvailabilityService,
  ) {}

  async findAvailableAssetId(dto: FindAvailableParams): Promise<string | null> {
    const assetId = await this.availabilityService.findAvailableAssetId(dto);
    return assetId;
  }

  async findAvailableAssetIds(dto: FindAvailableParams): Promise<string[]> {
    return this.availabilityService.findAvailableAssetIds(dto);
  }

  async saveAssignment(
    assignment: AssetAssignment,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, AssetNotAvailableError>> {
    try {
      await this.assignmentRepo.save(assignment, tx);
      return ok(undefined);
    } catch (error) {
      if (error instanceof PostgresExclusionViolationError) {
        return err(new AssetNotAvailableError(assignment.assetId));
      }
      throw error;
    }
  }
}
