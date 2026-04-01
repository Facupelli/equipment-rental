import { ProductCategory as PrismaProductCategory, Prisma } from 'src/generated/prisma/client';
import { ProductCategory } from 'src/modules/catalog/domain/entities/product-category.entity';

export class ProductCategoryMapper {
  static toDomain(raw: PrismaProductCategory): ProductCategory {
    return ProductCategory.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      description: raw.description,
    });
  }

  static toPersistence(entity: ProductCategory): Prisma.ProductCategoryUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.currentName,
      description: entity.currentDescription,
    };
  }
}
