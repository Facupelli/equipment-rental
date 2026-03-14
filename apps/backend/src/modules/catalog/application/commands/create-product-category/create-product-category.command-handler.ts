import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCategoryCommand } from './create-product-category.command';
import { ProductCategoryRepositoryPort } from 'src/modules/catalog/domain/ports/product-catalog.repository.port';
import { ProductCategory } from 'src/modules/catalog/domain/entities/product-category.entity';

@CommandHandler(CreateProductCategoryCommand)
export class CreateProductCategoryHandler implements ICommandHandler<CreateProductCategoryCommand> {
  constructor(private readonly productCategoryRepository: ProductCategoryRepositoryPort) {}

  async execute(command: CreateProductCategoryCommand): Promise<string> {
    const productCategory = ProductCategory.create({
      tenantId: command.tenantId,
      name: command.name,
      description: command.description,
    });

    return await this.productCategoryRepository.save(productCategory);
  }
}
