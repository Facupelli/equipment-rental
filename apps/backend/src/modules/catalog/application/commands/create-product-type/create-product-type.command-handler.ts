import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductTypeCommand } from './create-product-type.command';
import { ProductTypeRepositoryPort } from 'src/modules/catalog/domain/ports/product-type.repository.port';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';
import { ProductType } from 'src/modules/catalog/domain/entities/product-type.entity';

@CommandHandler(CreateProductTypeCommand)
export class CreateProductTypeCommandHandler implements ICommandHandler<CreateProductTypeCommand> {
  constructor(
    private readonly productTypeRepository: ProductTypeRepositoryPort,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async execute(command: CreateProductTypeCommand) {
    const tenantId = this.tenantContextService.requireTenantId();

    const productType = ProductType.create({ ...command.props, tenantId });

    return await this.productTypeRepository.save(productType);
  }
}
