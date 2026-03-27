import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { CreateProductCategoryCommand } from './create-product-category.command';
import { ProductCategory } from 'src/modules/catalog/domain/entities/product-category.entity';
import { ProductCategoryRepository } from 'src/modules/catalog/infrastructure/repositories/product-category.repository';
import { InvalidProductCategoryNameError } from 'src/modules/catalog/domain/errors/catalog.errors';

type CreateProductCategoryResult = Result<string, InvalidProductCategoryNameError>;

@CommandHandler(CreateProductCategoryCommand)
export class CreateProductCategoryService implements ICommandHandler<
  CreateProductCategoryCommand,
  CreateProductCategoryResult
> {
  constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

  async execute(command: CreateProductCategoryCommand): Promise<CreateProductCategoryResult> {
    const productCategoryResult = ProductCategory.create({
      tenantId: command.tenantId,
      name: command.name,
      description: command.description,
    });
    if (productCategoryResult.isErr()) {
      return err(productCategoryResult.error);
    }

    const productCategory = productCategoryResult.value;

    await this.productCategoryRepository.save(productCategory);

    return ok(productCategory.id);
  }
}
