import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { UpdateProductCategoryCommand } from './update-product-category.command';
import { ProductCategoryRepository } from 'src/modules/catalog/infrastructure/repositories/product-category.repository';
import {
  InvalidProductCategoryNameError,
  ProductCategoryNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

type UpdateProductCategoryResult = Result<void, ProductCategoryNotFoundError | InvalidProductCategoryNameError>;

@CommandHandler(UpdateProductCategoryCommand)
export class UpdateProductCategoryService implements ICommandHandler<
  UpdateProductCategoryCommand,
  UpdateProductCategoryResult
> {
  constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

  async execute(command: UpdateProductCategoryCommand): Promise<UpdateProductCategoryResult> {
    const productCategory = await this.productCategoryRepository.load(command.productCategoryId, command.tenantId);
    if (!productCategory) {
      return err(new ProductCategoryNotFoundError(command.productCategoryId));
    }

    const updateResult = productCategory.update(command.patch);
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }

    await this.productCategoryRepository.save(productCategory);

    return ok(undefined);
  }
}
