import { Result } from 'neverthrow';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { AssetNotAvailableError } from './domain/errors/inventory.errors';
import { AssetAssignment } from './domain/entities/asset-assignment.entity';
import { FindAvailableParams } from './inventory.contracts';

export abstract class InventoryPublicApi {
  abstract findAvailableAssetId(dto: FindAvailableParams): Promise<string | null>;
  abstract findAvailableAssetIds(dto: FindAvailableParams): Promise<string[]>;
  abstract findAssetById(tenantId: string, assetId: string): Promise<{ id: string; ownerId: string | null } | null>;
  abstract saveAssignment(
    assignment: AssetAssignment,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, AssetNotAvailableError>>;
}
