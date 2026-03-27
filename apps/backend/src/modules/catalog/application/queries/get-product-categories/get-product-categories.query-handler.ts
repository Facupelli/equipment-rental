import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetProductCategoriesQuery } from './get-product-categories.query';

type ProductCategoryReadModel = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@QueryHandler(GetProductCategoriesQuery)
export class GetProductCategoriesQueryHandler implements IQueryHandler<
  GetProductCategoriesQuery,
  ProductCategoryReadModel[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductCategoriesQuery): Promise<ProductCategoryReadModel[]> {
    const categories = await this.prisma.client.productCategory.findMany({
      where: { tenantId: query.tenantId },
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  }
}
