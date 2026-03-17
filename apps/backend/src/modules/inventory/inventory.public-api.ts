import { Result } from 'src/core/result';
import { AssetNotAvailableError } from './domain/exceptions/asset.exceptions';
import { PrismaTransactionClient } from '../order/domain/ports/order.repository.port';
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
