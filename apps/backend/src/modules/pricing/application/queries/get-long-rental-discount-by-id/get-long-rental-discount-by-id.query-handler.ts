import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetLongRentalDiscountByIdQuery } from './get-long-rental-discount-by-id.query';
import { GetLongRentalDiscountByIdResponseDto } from './get-long-rental-discount-by-id.response.dto';

@QueryHandler(GetLongRentalDiscountByIdQuery)
export class GetLongRentalDiscountByIdQueryHandler implements IQueryHandler<
  GetLongRentalDiscountByIdQuery,
  GetLongRentalDiscountByIdResponseDto | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLongRentalDiscountByIdQuery): Promise<GetLongRentalDiscountByIdResponseDto | null> {
    const row = await this.prisma.client.longRentalDiscount.findFirst({
      where: { id: query.id, tenantId: query.tenantId },
      include: { exclusions: true },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      priority: row.priority,
      isActive: row.isActive,
      tiers: row.tiers as GetLongRentalDiscountByIdResponseDto['tiers'],
      excludedProductTypeIds: row.exclusions.flatMap((exclusion) =>
        exclusion.productTypeId ? [exclusion.productTypeId] : [],
      ),
      excludedBundleIds: row.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
