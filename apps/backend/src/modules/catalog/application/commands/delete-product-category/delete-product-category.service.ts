import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PrismaService } from 'src/core/database/prisma.service';
import { isForeignKeyConstraintError } from 'src/core/utils/postgres-error.mapper';

import { DeleteProductCategoryCommand } from './delete-product-category.command';
import { ProductCategoryRepository } from 'src/modules/catalog/infrastructure/repositories/product-category.repository';
import {
  ProductCategoryHasAssignedProductTypesError,
  ProductCategoryNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';

type DeleteProductCategoryResult = Result<
  void,
  ProductCategoryNotFoundError | ProductCategoryHasAssignedProductTypesError
>;

@CommandHandler(DeleteProductCategoryCommand)
export class DeleteProductCategoryService implements ICommandHandler<
  DeleteProductCategoryCommand,
  DeleteProductCategoryResult
> {
  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: DeleteProductCategoryCommand): Promise<DeleteProductCategoryResult> {
    const productCategory = await this.productCategoryRepository.load(command.productCategoryId, command.tenantId);
    if (!productCategory) {
      return err(new ProductCategoryNotFoundError(command.productCategoryId));
    }

    const productTypesInCategoryCount = await this.prisma.client.productType.count({
      where: { categoryId: command.productCategoryId, tenantId: command.tenantId },
    });
    const hasAssignedProductTypes = productTypesInCategoryCount > 0;

    if (hasAssignedProductTypes) {
      return err(new ProductCategoryHasAssignedProductTypesError(command.productCategoryId));
    }

    try {
      await this.prisma.client.productCategory.delete({ where: { id: command.productCategoryId } });
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        return err(new ProductCategoryHasAssignedProductTypesError(command.productCategoryId));
      }

      throw error;
    }

    return ok(undefined);
  }
}
