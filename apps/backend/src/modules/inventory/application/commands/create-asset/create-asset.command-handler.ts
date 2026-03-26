import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAssetCommand } from './create-asset.command';
import { Asset } from '../../../domain/entities/asset.entity';
import { CatalogPublicApi } from 'src/modules/catalog/catalog.public-api';
import {
  DuplicateSerialNumberError,
  ProductTypeNotFoundError,
  SerialNumberRequiredException,
} from 'src/modules/inventory/domain/exceptions/asset.exceptions';
import { TrackingMode } from '@repo/types';
import { err, ok } from 'src/core/result';
import { AssetSerialNumberService } from 'src/modules/inventory/infrastructure/services/asset-serial-number.service';
import { AssetRepository } from 'src/modules/inventory/infrastructure/persistance/repositories/asset.repository';

@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand> {
  constructor(
    private readonly catalogApi: CatalogPublicApi,
    private readonly assetRepository: AssetRepository,
    private readonly serialNumberService: AssetSerialNumberService,
  ) {}

  async execute(command: CreateAssetCommand) {
    const { productTypeId, serialNumber } = command.props;

    const product = await this.catalogApi.getProductType(productTypeId);

    if (!product) {
      return err(new ProductTypeNotFoundError(productTypeId));
    }

    if (product.trackingMode === TrackingMode.IDENTIFIED) {
      if (!serialNumber) {
        throw new SerialNumberRequiredException();
      }

      const taken = await this.serialNumberService.isTaken(serialNumber);
      if (taken) {
        return err(new DuplicateSerialNumberError(serialNumber));
      }
    }

    const asset = Asset.create(command.props);
    await this.assetRepository.save(asset);

    return ok(asset.id);
  }
}
