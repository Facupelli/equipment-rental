import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductTypeCommand } from './create-product-type.command';
import { ProductTypeRepositoryPort } from 'src/modules/catalog/domain/ports/product-type.repository.port';
import { ProductType } from 'src/modules/catalog/domain/entities/product-type.entity';

@CommandHandler(CreateProductTypeCommand)
export class CreateProductTypeCommandHandler implements ICommandHandler<CreateProductTypeCommand> {
  constructor(private readonly productTypeRepository: ProductTypeRepositoryPort) {}

  async execute(command: CreateProductTypeCommand) {
    const productType = ProductType.create({ ...command.props, tenantId: command.tenantId });

    return await this.productTypeRepository.save(productType);
  }
}
