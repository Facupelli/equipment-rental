import { Prisma, Category as PrismaCategory } from 'src/generated/prisma/client';
import { Category, CategoryProps } from '../../../domain/entities/category.entity';
import { CategoryResponseDto } from '@repo/schemas';

export class CategoryMapper {
  public static toDomain(prismaCategory: PrismaCategory): Category {
    const props: CategoryProps = {
      id: prismaCategory.id,
      tenantId: prismaCategory.tenantId,
      name: prismaCategory.name,
      description: prismaCategory.description,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
    };

    return Category.reconstitute(props);
  }

  public static toPersistence(entity: Category): Prisma.CategoryUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static toResponse(entity: Category): CategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
