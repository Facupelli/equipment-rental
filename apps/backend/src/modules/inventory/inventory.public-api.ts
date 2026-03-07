import { Result } from 'src/core/result';
import { AssetNotAvailableError } from './domain/exceptions/asset.exceptions';
import { PrismaTransactionClient } from '../order/domain/ports/order.repository.port';
import { AssetAssignment } from './domain/entities/asset-assignment.entity';

export type FindAvailableAssetDto = {
  productTypeId: string;
  locationId: string;
  period: { start: Date; end: Date };
  assetId?: string;
};

export abstract class InventoryPublicApi {
  abstract findAvailableAssetId(dto: FindAvailableAssetDto): Promise<string | null>;
  abstract saveAssignment(
    assignment: AssetAssignment,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, AssetNotAvailableError>>;
}
