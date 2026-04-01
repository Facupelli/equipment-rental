import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { TrackingMode } from '@repo/types';

import { CatalogPublicApi } from 'src/modules/catalog/catalog.public-api';
import { AssetRepository } from 'src/modules/inventory/infrastructure/persistence/repositories/asset.repository';
import { AssetSerialNumberService } from 'src/modules/inventory/infrastructure/read-services/asset-serial-number.service';
import {
  AssetNotFoundError,
  DuplicateSerialNumberError,
  ProductTypeNotFoundError,
  SerialNumberRequiredError,
} from 'src/modules/inventory/domain/errors/inventory.errors';

import { UpdateAssetCommand } from './update-asset.command';

type UpdateAssetResult = Result<
  void,
  AssetNotFoundError | ProductTypeNotFoundError | DuplicateSerialNumberError | SerialNumberRequiredError
>;

@CommandHandler(UpdateAssetCommand)
export class UpdateAssetService implements ICommandHandler<UpdateAssetCommand, UpdateAssetResult> {
  constructor(
    private readonly catalogApi: CatalogPublicApi,
    private readonly assetRepository: AssetRepository,
    private readonly serialNumberService: AssetSerialNumberService,
  ) {}

  async execute(command: UpdateAssetCommand): Promise<UpdateAssetResult> {
    const asset = await this.assetRepository.load(command.assetId, command.tenantId);
    if (!asset) {
      return err(new AssetNotFoundError(command.assetId));
    }

    if (command.patch.serialNumber !== undefined) {
      const product = await this.catalogApi.getProductType(asset.productTypeId);

      if (!product) {
        return err(new ProductTypeNotFoundError(asset.productTypeId));
      }

      if (product.trackingMode === TrackingMode.IDENTIFIED && !command.patch.serialNumber) {
        return err(new SerialNumberRequiredError(asset.productTypeId));
      }

      if (command.patch.serialNumber) {
        const taken = await this.serialNumberService.isTaken(command.patch.serialNumber, asset.id);
        if (taken) {
          return err(new DuplicateSerialNumberError(command.patch.serialNumber));
        }
      }
    }

    asset.update(command.patch);
    await this.assetRepository.save(asset);

    return ok(undefined);
  }
}
