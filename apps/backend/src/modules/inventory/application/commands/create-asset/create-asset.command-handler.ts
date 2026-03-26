import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAssetCommand } from './create-asset.command';
import { Asset } from '../../../domain/entities/asset.entity';
import { CatalogPublicApi } from 'src/modules/catalog/catalog.public-api';
import {
  DuplicateSerialNumberError,
  ProductTypeNotFoundError,
  SerialNumberRequiredError,
} from 'src/modules/inventory/domain/errors/inventory.errors';
import { TrackingMode } from '@repo/types';
import { Result, err, ok } from 'src/core/result';
import { AssetSerialNumberService } from 'src/modules/inventory/infrastructure/services/asset-serial-number.service';
import { AssetRepository } from 'src/modules/inventory/infrastructure/persistance/repositories/asset.repository';

type CreateAssetResult = Result<
  string,
  ProductTypeNotFoundError | DuplicateSerialNumberError | SerialNumberRequiredError
>;

@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand> {
  constructor(
    private readonly catalogApi: CatalogPublicApi,
    private readonly assetRepository: AssetRepository,
    private readonly serialNumberService: AssetSerialNumberService,
  ) {}

  async execute(command: CreateAssetCommand): Promise<CreateAssetResult> {
    const { productTypeId, serialNumber } = command;

    const product = await this.catalogApi.getProductType(productTypeId);

    if (!product) {
      return err(new ProductTypeNotFoundError(productTypeId));
    }

    if (product.trackingMode === TrackingMode.IDENTIFIED) {
      if (!serialNumber) {
        return err(new SerialNumberRequiredError(productTypeId));
      }

      const taken = await this.serialNumberService.isTaken(serialNumber);
      if (taken) {
        return err(new DuplicateSerialNumberError(serialNumber));
      }
    }

    const asset = Asset.create({
      locationId: command.locationId,
      productTypeId: command.productTypeId,
      ownerId: command.ownerId,
      serialNumber: command.serialNumber,
      notes: command.notes,
    });
    await this.assetRepository.save(asset);

    return ok(asset.id);
  }
}
