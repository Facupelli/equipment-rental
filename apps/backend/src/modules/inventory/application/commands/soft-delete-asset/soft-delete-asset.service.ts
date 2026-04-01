import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import {
  AssetHasActiveOrFutureBookingsError,
  AssetNotFoundError,
} from 'src/modules/inventory/domain/errors/inventory.errors';
import { AssetRepository } from 'src/modules/inventory/infrastructure/persistence/repositories/asset.repository';

import { SoftDeleteAssetCommand } from './soft-delete-asset.command';

type SoftDeleteAssetResult = Result<void, AssetNotFoundError | AssetHasActiveOrFutureBookingsError>;

@CommandHandler(SoftDeleteAssetCommand)
export class SoftDeleteAssetService implements ICommandHandler<SoftDeleteAssetCommand, SoftDeleteAssetResult> {
  constructor(private readonly assetRepository: AssetRepository) {}

  async execute(command: SoftDeleteAssetCommand): Promise<SoftDeleteAssetResult> {
    const asset = await this.assetRepository.load(command.assetId, command.tenantId);
    if (!asset) {
      return err(new AssetNotFoundError(command.assetId));
    }

    if (asset.hasActiveOrFutureOrderAssignments(new Date())) {
      return err(new AssetHasActiveOrFutureBookingsError(command.assetId));
    }

    asset.softDelete();
    await this.assetRepository.save(asset);

    return ok(undefined);
  }
}
