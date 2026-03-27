import { Result } from 'neverthrow';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { AssignmentSource, AssignmentType } from '@repo/types';
import { AssetNotAvailableError } from './domain/errors/inventory.errors';
import { FindAvailableParams } from './inventory.contracts';

export type SaveOrderAssignmentDto = {
  assetId: string;
  period: DateRange;
  type: AssignmentType.ORDER;
  source: AssignmentSource;
  orderId: string;
  orderItemId: string;
};

export abstract class InventoryPublicApi {
  abstract findAvailableAssetId(dto: FindAvailableParams): Promise<string | null>;
  abstract findAvailableAssetIds(dto: FindAvailableParams): Promise<string[]>;
  abstract findAssetById(tenantId: string, assetId: string): Promise<{ id: string; ownerId: string | null } | null>;
  abstract saveOrderAssignment(
    dto: SaveOrderAssignmentDto,
    tx: PrismaTransactionClient,
  ): Promise<Result<void, AssetNotAvailableError>>;
}
