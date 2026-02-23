import { Product as PrismaProduct } from 'src/generated/prisma/client';
import { Prisma } from 'src/generated/prisma/browser';
import { Product, ProductProps } from '../../domain/entities/product.entity';
import { TrackingType } from '@repo/types';

export class ProductMapper {
  public static toDomain(prismaProduct: PrismaProduct): Product {
    const props: ProductProps = {
      id: prismaProduct.id,
      tenantId: prismaProduct.tenantId,
      name: prismaProduct.name,
      trackingType: prismaProduct.trackingType as TrackingType,

      // Prisma returns Decimal objects. Convert to number for domain simplicity.
      baseRentalPrice: prismaProduct.baseRentalPrice.toNumber(),

      // Prisma returns JsonValue. We assume it matches our domain structure.
      attributes: prismaProduct.attributes as Record<string, any>,

      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
    };

    return Product.reconstitute(props);
  }

  public static toPersistence(entity: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: entity.Id,
      tenantId: entity.TenantId, // Prisma relation syntax
      name: entity.Name,
      trackingType: entity.TrackingType,
      baseRentalPrice: entity.BaseRentalPrice,
      attributes: entity.Attributes,
      createdAt: entity.CreatedAt,
      updatedAt: entity.UpdatedAt,
    };
  }
}
