import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RetireProductTypeCommand } from './publish-product.command';
import { ProductTypeRepositoryPort } from 'src/modules/catalog/domain/ports/product-type.repository.port';
import { ProductTypeAlreadyRetiredException } from 'src/modules/catalog/domain/exceptions/product-type.exceptions';

@Injectable()
@CommandHandler(RetireProductTypeCommand)
export class RetireProductTypeCommandHandler implements ICommandHandler<RetireProductTypeCommand, void> {
  constructor(private readonly productTypeRepo: ProductTypeRepositoryPort) {}

  async execute(command: RetireProductTypeCommand): Promise<void> {
    const productType = await this.productTypeRepo.load(command.productTypeId);
    if (!productType) {
      throw new NotFoundException(`ProductType ${command.productTypeId} not found`);
    }

    try {
      productType.retire();
    } catch (e) {
      if (e instanceof ProductTypeAlreadyRetiredException) {
        throw new ConflictException(e.message);
      }
      throw e;
    }

    await this.productTypeRepo.save(productType);
  }
}
