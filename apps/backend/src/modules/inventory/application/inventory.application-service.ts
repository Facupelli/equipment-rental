import { Injectable } from '@nestjs/common';
import { AssetAssignment } from '../domain/entities/asset-assignment.entity';
import { DateRange } from '../domain/value-objects/date-range.vo';
import { FindAvailableAssetDto, InventoryPublicApi } from '../inventory.public-api';
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

  async findAvailableAssetId(dto: FindAvailableAssetDto): Promise<string | null> {
    const period = DateRange.create(dto.period.start, dto.period.end);

    const assetId = await this.availabilityService.findAvailableAssetId({
      productTypeId: dto.productTypeId,
      locationId: dto.locationId,
      period,
      assetId: dto.assetId,
    });

    return assetId;
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
        return err(new AssetNotAvailableError());
      }
      throw error;
    }
  }
}
