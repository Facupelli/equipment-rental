import { Result } from 'src/core/result';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { AssetNotAvailableError } from './domain/errors/inventory.errors';
import { AssetAssignment } from './domain/entities/asset-assignment.entity';
import { FindAvailableParams } from './infrastructure/services/asset-availability.service';

export abstract class InventoryPublicApi {
  abstract findAvailableAssetId(dto: FindAvailableParams): Promise<string | null>;
  abstract findAvailableAssetIds(dto: FindAvailableParams): Promise<string[]>;
  abstract saveAssignment(
    assignment: AssetAssignment,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, AssetNotAvailableError>>;
}
