import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCategoryCommand } from './create-product-category.command';
import { ProductCategoryRepositoryPort } from 'src/modules/catalog/domain/ports/product-catalog.repository.port';
import { ProductCategory } from 'src/modules/catalog/domain/entities/product-category.entity';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';

@CommandHandler(CreateProductCategoryCommand)
export class CreateProductCategoryHandler implements ICommandHandler<CreateProductCategoryCommand> {
  constructor(
    private readonly productCategoryRepository: ProductCategoryRepositoryPort,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async execute(command: CreateProductCategoryCommand): Promise<string> {
    const tenantId = this.tenantContextService.requireTenantId();

    const productCategory = ProductCategory.create({
      name: command.name,
      description: command.description,
      tenantId,
    });

    return await this.productCategoryRepository.save(productCategory);
  }
}
