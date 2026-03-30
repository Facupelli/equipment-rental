import { Injectable } from '@nestjs/common';
import { Result, err, ok } from 'neverthrow';

import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { PostgresExclusionViolationError } from 'src/core/utils/postgres-error.mapper';
import { OrderAssignmentStage } from '@repo/types';

import { AssetAssignment } from './domain/entities/asset-assignment.entity';
import { AssetNotAvailableError } from './domain/errors/inventory.errors';
import { AssetAssignmentRepository } from './infrastructure/persistence/repositories/asset-assignment.repository';
import { AssetAvailabilityService } from './infrastructure/read-services/asset-availability.service';
import { FindAvailableParams } from './inventory.contracts';
import { InventoryPublicApi, SaveOrderAssignmentDto } from './inventory.public-api';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class InventoryFacade implements InventoryPublicApi {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignmentRepo: AssetAssignmentRepository,
    private readonly availabilityService: AssetAvailabilityService,
  ) {}

  async findAvailableAssetId(dto: FindAvailableParams): Promise<string | null> {
    return this.availabilityService.findAvailableAssetId(dto);
  }

  async findAvailableAssetIds(dto: FindAvailableParams): Promise<string[]> {
    return this.availabilityService.findAvailableAssetIds(dto);
  }

  async findAssetById(tenantId: string, assetId: string): Promise<{ id: string; ownerId: string | null } | null> {
    const asset = await this.prisma.client.asset.findFirst({
      where: {
        id: assetId,
        location: {
          tenantId,
        },
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    return asset ?? null;
  }

  async saveOrderAssignment(
    dto: SaveOrderAssignmentDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, AssetNotAvailableError>> {
    const assignment = AssetAssignment.create(dto);

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

  async transitionOrderAssignmentsStage(
    orderId: string,
    fromStage: OrderAssignmentStage,
    toStage: OrderAssignmentStage,
    tx: PrismaTransactionClient,
  ): Promise<void> {
    await this.assignmentRepo.transitionOrderAssignmentsStage(orderId, fromStage, toStage, tx);
  }

  async releaseOrderAssignments(
    orderId: string,
    stage: OrderAssignmentStage,
    tx: PrismaTransactionClient,
  ): Promise<void> {
    await this.assignmentRepo.releaseOrderAssignments(orderId, stage, tx);
  }
}
