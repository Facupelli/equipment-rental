import { Injectable } from '@nestjs/common';
import { Result, err, ok } from 'neverthrow';

import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { PostgresExclusionViolationError } from 'src/core/utils/postgres-error.mapper';

import { AssetAssignment } from './domain/entities/asset-assignment.entity';
import { AssetNotAvailableError } from './domain/errors/inventory.errors';
import { AssetAssignmentRepository } from './infrastructure/persistance/repositories/asset-assignment.repository';
import { AssetAvailabilityService } from './infrastructure/read-services/asset-availability.service';
import { FindAvailableParams } from './inventory.contracts';
import { InventoryPublicApi } from './inventory.public-api';

@Injectable()
export class InventoryFacade implements InventoryPublicApi {
  constructor(
    private readonly assignmentRepo: AssetAssignmentRepository,
    private readonly availabilityService: AssetAvailabilityService,
  ) {}

  async findAvailableAssetId(dto: FindAvailableParams): Promise<string | null> {
    return this.availabilityService.findAvailableAssetId(dto);
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
