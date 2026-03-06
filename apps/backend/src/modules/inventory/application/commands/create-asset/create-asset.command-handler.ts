import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAssetCommand } from './create-asset.command';
import { AssetRepositoryPort } from '../../../domain/ports/asset.repository.port';
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

@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand> {
  constructor(
    private readonly catalogApi: CatalogPublicApi,
    private readonly assetRepository: AssetRepositoryPort,
    private readonly serialNumberService: AssetSerialNumberService,
  ) {}

  async execute(command: CreateAssetCommand) {
    const { productTypeId, serialNumber } = command.props;

    const product = await this.catalogApi.getProductType(productTypeId);

    console.log({ product });
    if (!product) {
      return err(new ProductTypeNotFoundError(productTypeId));
    }

    if (product.trackingMode === TrackingMode.IDENTIFIED) {
      if (!serialNumber) {
        throw new SerialNumberRequiredException();
      }

      console.log('IDENTIFIED', 'SERIAL NUMBER PROVIDED');

      const taken = await this.serialNumberService.isTaken(serialNumber);
      console.log({ taken });
      if (taken) {
        return err(new DuplicateSerialNumberError(serialNumber));
      }
    }

    const asset = Asset.create(command.props);
    await this.assetRepository.save(asset);

    return ok(asset.id);
  }
}
