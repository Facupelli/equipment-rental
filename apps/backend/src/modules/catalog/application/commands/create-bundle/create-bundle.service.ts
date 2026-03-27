import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBundleCommand } from './create-bundle.command';
import { Result, err, ok } from 'neverthrow';
import { Bundle } from 'src/modules/catalog/domain/entities/bundle.entity';
import { BundleRepository } from 'src/modules/catalog/infrastructure/repositories/bundle.repository';
import { ProductTypeRepository } from 'src/modules/catalog/infrastructure/repositories/product-type.repository';
import {
  DuplicateBundleComponentError,
  InvalidBundleComponentQuantityError,
  InvalidBundleNameError,
  ReferencedProductTypeNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

type CreateBundleResult = Result<
  string,
  | ReferencedProductTypeNotFoundError
  | InvalidBundleNameError
  | DuplicateBundleComponentError
  | InvalidBundleComponentQuantityError
>;

@CommandHandler(CreateBundleCommand)
export class CreateBundleService implements ICommandHandler<CreateBundleCommand, CreateBundleResult> {
  constructor(
    private readonly bundleRepo: BundleRepository,
    private readonly productTypeRepository: ProductTypeRepository,
  ) {}

  async execute(command: CreateBundleCommand): Promise<CreateBundleResult> {
    const productTypes = await Promise.all(
      command.components.map((component) => this.productTypeRepository.load(component.productTypeId, command.tenantId)),
    );

    const missingIndex = productTypes.findIndex((productType) => productType === null);
    if (missingIndex !== -1) {
      return err(new ReferencedProductTypeNotFoundError(command.components[missingIndex].productTypeId));
    }

    const bundleResult = Bundle.create({
      tenantId: command.tenantId,
      billingUnitId: command.billingUnitId,
      name: command.name,
      imageUrl: command.imageUrl,
      description: command.description,
    });
    if (bundleResult.isErr()) {
      return err(bundleResult.error);
    }

    const bundle = bundleResult.value;

    for (const component of command.components) {
      const addComponentResult = bundle.addComponent(component.productTypeId, component.quantity);
      if (addComponentResult.isErr()) {
        return err(addComponentResult.error);
      }
    }

    await this.bundleRepo.save(bundle);
    return ok(bundle.id);
  }
}
