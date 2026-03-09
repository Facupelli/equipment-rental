import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishProductTypeCommand } from './publish-product.command';
import { ProductTypeRepositoryPort } from 'src/modules/catalog/domain/ports/product-type.repository.port';
import {
  ProductTypeAlreadyPublishedException,
  ProductTypeAlreadyRetiredException,
} from 'src/modules/catalog/domain/exceptions/product-type.exceptions';

@Injectable()
@CommandHandler(PublishProductTypeCommand)
export class PublishProductTypeCommandHandler implements ICommandHandler<PublishProductTypeCommand, void> {
  constructor(private readonly productTypeRepo: ProductTypeRepositoryPort) {}

  async execute(command: PublishProductTypeCommand): Promise<void> {
    const productType = await this.productTypeRepo.load(command.productTypeId);
    if (!productType) {
      throw new NotFoundException(`ProductType ${command.productTypeId} not found`);
    }

    try {
      productType.publish();
      console.log('published');
    } catch (e) {
      if (e instanceof ProductTypeAlreadyPublishedException) {
        throw new ConflictException(e.message);
      }
      if (e instanceof ProductTypeAlreadyRetiredException) {
        throw new ConflictException(e.message);
      }
      throw e;
    }

    await this.productTypeRepo.save(productType);
  }
}
