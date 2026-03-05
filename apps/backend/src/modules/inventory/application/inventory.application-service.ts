import { Injectable } from '@nestjs/common';
import { AssetAssignment } from '../domain/entities/asset-assignment.entity';
import { DateRange } from '../domain/value-objects/date-range.vo';
import { AssignmentType, AssignmentSource } from '@repo/types';
import { InventoryPublicApi, ReserveAssetDto, ReservedAssetDto } from '../inventory.public-api';
import { AssetAssignmentRepositoryPort } from '../domain/ports/asset-assignment.repository.port';
import { AssetNotAvailableError } from '../domain/exceptions/asset.exceptions';
import { err, ok, Result } from 'src/core/result';
import { PostgresExclusionViolationError } from 'src/core/utils/postgres-error.mapper';
import { AssetAvailabilityService } from '../infrastructure/services/asset-availability.service';
import { PrismaTransactionClient } from 'src/modules/order/domain/ports/order.repository.port';

@Injectable()
export class InventoryApplicationService implements InventoryPublicApi {
  constructor(
    private readonly assignmentRepo: AssetAssignmentRepositoryPort,
    private readonly availabilityService: AssetAvailabilityService,
  ) {}

  async reserveAsset(
    dto: ReserveAssetDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<ReservedAssetDto, AssetNotAvailableError>> {
    const period = DateRange.create(dto.period.start, dto.period.end);

    // Step 1: Find an available asset — domain-level fast fail.
    // This catches the obvious unavailability case without hitting the DB write path.
    const assetId = await this.availabilityService.findAvailableAssetId({
      productTypeId: dto.productTypeId,
      locationId: dto.locationId,
      period,
      assetId: dto.assetId,
    });

    if (!assetId) {
      return err(new AssetNotAvailableError());
    }

    // Step 2: Build the assignment record.
    const assignment = AssetAssignment.create({
      assetId,
      period,
      type: AssignmentType.ORDER,
      source: AssignmentSource.OWNED,
      orderId: dto.orderId,
      orderItemId: dto.orderItemId,
    });

    // Step 3: Persist — the EXCLUDE constraint is the authoritative concurrency guard.
    // If two requests passed findAvailable simultaneously, only one insert succeeds.
    try {
      await this.assignmentRepo.save(assignment, tx);
    } catch (error) {
      if (error instanceof PostgresExclusionViolationError) {
        return err(new AssetNotAvailableError());
      }
      throw error;
    }

    return ok({ assetId, assignmentId: assignment.id });
  }
}
