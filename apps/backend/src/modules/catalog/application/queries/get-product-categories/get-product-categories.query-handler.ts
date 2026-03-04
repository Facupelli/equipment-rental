import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetProductCategoriesQuery } from './get-product-categories.query';
import { ProductCategoryListResponse } from '@repo/schemas';

@QueryHandler(GetProductCategoriesQuery)
export class GetProductCategoriesQueryHandler implements IQueryHandler<
  GetProductCategoriesQuery,
  ProductCategoryListResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(_: GetProductCategoriesQuery): Promise<ProductCategoryListResponse> {
    const categories = await this.prisma.client.productCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  }
}
