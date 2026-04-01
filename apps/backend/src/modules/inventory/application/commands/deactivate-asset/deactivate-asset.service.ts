import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { AssetNotFoundError } from 'src/modules/inventory/domain/errors/inventory.errors';
import { AssetRepository } from 'src/modules/inventory/infrastructure/persistence/repositories/asset.repository';

import { DeactivateAssetCommand } from './deactivate-asset.command';

type DeactivateAssetResult = Result<void, AssetNotFoundError>;

@CommandHandler(DeactivateAssetCommand)
export class DeactivateAssetService implements ICommandHandler<DeactivateAssetCommand, DeactivateAssetResult> {
  constructor(private readonly assetRepository: AssetRepository) {}

  async execute(command: DeactivateAssetCommand): Promise<DeactivateAssetResult> {
    const asset = await this.assetRepository.load(command.assetId, command.tenantId);
    if (!asset) {
      return err(new AssetNotFoundError(command.assetId));
    }

    asset.deactivate();
    await this.assetRepository.save(asset);

    return ok(undefined);
  }
}
