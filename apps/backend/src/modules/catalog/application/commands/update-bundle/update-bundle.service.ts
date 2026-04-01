import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { UpdateBundleCommand } from './update-bundle.command';
import { BundleRepository } from 'src/modules/catalog/infrastructure/repositories/bundle.repository';
import { ProductTypeRepository } from 'src/modules/catalog/infrastructure/repositories/product-type.repository';
import {
  BundleAlreadyRetiredError,
  BundleNotFoundError,
  DuplicateBundleComponentError,
  InvalidBundleComponentQuantityError,
  InvalidBundleNameError,
  ReferencedProductTypeNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

type UpdateBundleResult = Result<
  void,
  | BundleNotFoundError
  | ReferencedProductTypeNotFoundError
  | InvalidBundleNameError
  | DuplicateBundleComponentError
  | InvalidBundleComponentQuantityError
  | BundleAlreadyRetiredError
>;

@CommandHandler(UpdateBundleCommand)
export class UpdateBundleService implements ICommandHandler<UpdateBundleCommand, UpdateBundleResult> {
  constructor(
    private readonly bundleRepo: BundleRepository,
    private readonly productTypeRepository: ProductTypeRepository,
  ) {}

  async execute(command: UpdateBundleCommand): Promise<UpdateBundleResult> {
    const bundle = await this.bundleRepo.load(command.bundleId, command.tenantId);
    if (!bundle) {
      return err(new BundleNotFoundError(command.bundleId));
    }

    const updateResult = bundle.update({
      billingUnitId: command.patch.billingUnitId,
      name: command.patch.name,
      imageUrl: command.patch.imageUrl,
      description: command.patch.description,
    });
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }

    if (command.patch.components !== undefined) {
      const duplicateProductTypeId = this.findDuplicateProductTypeId(command.patch.components);
      if (duplicateProductTypeId) {
        return err(new DuplicateBundleComponentError(duplicateProductTypeId));
      }

      const productTypes = await Promise.all(
        command.patch.components.map((component) =>
          this.productTypeRepository.load(component.productTypeId, command.tenantId),
        ),
      );

      const missingIndex = productTypes.findIndex((productType) => productType === null);
      if (missingIndex !== -1) {
        return err(new ReferencedProductTypeNotFoundError(command.patch.components[missingIndex].productTypeId));
      }

      for (const component of bundle.getComponents()) {
        const removeResult = bundle.removeComponent(component.productTypeId);
        if (removeResult.isErr()) {
          return err(removeResult.error);
        }
      }

      for (const component of command.patch.components) {
        const addResult = bundle.addComponent(component.productTypeId, component.quantity);
        if (addResult.isErr()) {
          return err(addResult.error);
        }
      }
    }

    await this.bundleRepo.save(bundle);

    return ok(undefined);
  }

  private findDuplicateProductTypeId(components: { productTypeId: string }[]): string | null {
    const seen = new Set<string>();

    for (const component of components) {
      if (seen.has(component.productTypeId)) {
        return component.productTypeId;
      }

      seen.add(component.productTypeId);
    }

    return null;
  }
}
