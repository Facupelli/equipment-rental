import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PublishProductTypeCommand } from './publish-product-type.command';
import {
  ProductTypeAlreadyPublishedError,
  ProductTypeAlreadyRetiredError,
  ProductTypeNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';
import { ProductTypeRepository } from 'src/modules/catalog/infrastructure/repositories/product-type.repository';

type PublishProductTypeResult = Result<
  void,
  ProductTypeNotFoundError | ProductTypeAlreadyPublishedError | ProductTypeAlreadyRetiredError
>;

@Injectable()
@CommandHandler(PublishProductTypeCommand)
export class PublishProductTypeService implements ICommandHandler<PublishProductTypeCommand, PublishProductTypeResult> {
  constructor(private readonly productTypeRepo: ProductTypeRepository) {}

  async execute(command: PublishProductTypeCommand): Promise<PublishProductTypeResult> {
    const productType = await this.productTypeRepo.load(command.productTypeId, command.tenantId);
    if (!productType) {
      return err(new ProductTypeNotFoundError(command.productTypeId));
    }

    const publishResult = productType.publish();
    if (publishResult.isErr()) {
      return err(publishResult.error);
    }

    await this.productTypeRepo.save(productType);

    return ok(undefined);
  }
}
