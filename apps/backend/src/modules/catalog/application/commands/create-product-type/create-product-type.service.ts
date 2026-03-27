import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { CreateProductTypeCommand } from './create-product-type.command';
import { ProductType } from 'src/modules/catalog/domain/entities/product-type.entity';
import { ProductTypeRepository } from 'src/modules/catalog/infrastructure/repositories/product-type.repository';
import { InvalidProductTypeNameError } from 'src/modules/catalog/domain/errors/catalog.errors';

type CreateProductTypeResult = Result<string, InvalidProductTypeNameError>;

@CommandHandler(CreateProductTypeCommand)
export class CreateProductTypeService implements ICommandHandler<CreateProductTypeCommand, CreateProductTypeResult> {
  constructor(private readonly productTypeRepository: ProductTypeRepository) {}

  async execute(command: CreateProductTypeCommand): Promise<CreateProductTypeResult> {
    const productTypeResult = ProductType.create({ ...command.props, tenantId: command.tenantId });
    if (productTypeResult.isErr()) {
      return err(productTypeResult.error);
    }

    const productType = productTypeResult.value;

    await this.productTypeRepository.save(productType);

    return ok(productType.id);
  }
}
