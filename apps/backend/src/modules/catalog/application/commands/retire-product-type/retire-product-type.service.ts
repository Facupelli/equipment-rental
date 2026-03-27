import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { RetireProductTypeCommand } from './retire-product-type.command';
import {
  ProductTypeAlreadyRetiredError,
  ProductTypeNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';
import { ProductTypeRepository } from 'src/modules/catalog/infrastructure/repositories/product-type.repository';

type RetireProductTypeResult = Result<void, ProductTypeNotFoundError | ProductTypeAlreadyRetiredError>;

@Injectable()
@CommandHandler(RetireProductTypeCommand)
export class RetireProductTypeService implements ICommandHandler<RetireProductTypeCommand, RetireProductTypeResult> {
  constructor(private readonly productTypeRepo: ProductTypeRepository) {}

  async execute(command: RetireProductTypeCommand): Promise<RetireProductTypeResult> {
    const productType = await this.productTypeRepo.load(command.productTypeId, command.tenantId);
    if (!productType) {
      return err(new ProductTypeNotFoundError(command.productTypeId));
    }

    const retireResult = productType.retire();
    if (retireResult.isErr()) {
      return err(retireResult.error);
    }

    await this.productTypeRepo.save(productType);

    return ok(undefined);
  }
}
