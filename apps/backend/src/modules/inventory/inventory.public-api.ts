import { Result } from 'src/core/result';
import { AssetNotAvailableError } from './domain/exceptions/asset.exceptions';
import { PrismaTransactionClient } from '../order/domain/ports/order.repository.port';

export type ReserveAssetDto = {
  productTypeId: string;
  locationId: string;
  orderId: string;
  orderItemId: string;
  period: { start: Date; end: Date };
  // If provided, the system will attempt to assign this specific asset.
  // If omitted, the system picks any available unit of the correct product type.
  assetId?: string;
};

export type ReservedAssetDto = {
  assetId: string;
  assignmentId: string;
};

export abstract class InventoryPublicApi {
  abstract reserveAsset(
    dto: ReserveAssetDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<ReservedAssetDto, AssetNotAvailableError>>;
}
