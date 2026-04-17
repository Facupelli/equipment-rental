import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { GetPromotionByIdQuery } from './get-promotion-by-id.query';
import { GetPromotionByIdResponseDto } from './get-promotion-by-id.response.dto';
import { PromotionType } from '@repo/types';

const toPromotionActivationType = (persistedType: PromotionType) =>
  (persistedType === 'COUPON' ? 'COUPON' : 'AUTOMATIC') as GetPromotionByIdResponseDto['activationType'];

const toPromotionStackingType = (isStackable: boolean) =>
  (isStackable ? 'COMBINABLE' : 'EXCLUSIVE') as GetPromotionByIdResponseDto['stackingType'];

@QueryHandler(GetPromotionByIdQuery)
export class GetPromotionByIdQueryHandler implements IQueryHandler<
  GetPromotionByIdQuery,
  GetPromotionByIdResponseDto | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPromotionByIdQuery): Promise<GetPromotionByIdResponseDto | null> {
    const row = await this.prisma.client.promotion.findFirst({
      where: { id: query.id, tenantId: query.tenantId },
      include: { exclusions: true },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      activationType: toPromotionActivationType(row.type as PromotionType),
      priority: row.priority,
      stackingType: toPromotionStackingType(row.stackable),
      validFrom: ((row.condition as { validFrom?: string | null }).validFrom
        ? new Date((row.condition as { validFrom?: string | null }).validFrom!)
        : null) as GetPromotionByIdResponseDto['validFrom'],
      validUntil: ((row.condition as { validUntil?: string | null }).validUntil
        ? new Date((row.condition as { validUntil?: string | null }).validUntil!)
        : null) as GetPromotionByIdResponseDto['validUntil'],
      isActive: row.isActive,
      conditions: ((row.condition as { conditions?: GetPromotionByIdResponseDto['conditions'] }).conditions ??
        []) as GetPromotionByIdResponseDto['conditions'],
      applicability: {
        appliesTo: ((row.condition as { appliesTo?: GetPromotionByIdResponseDto['applicability']['appliesTo'] })
          .appliesTo ?? ['PRODUCT', 'BUNDLE']) as GetPromotionByIdResponseDto['applicability']['appliesTo'],
        excludedProductTypeIds: row.exclusions.flatMap((exclusion) =>
          exclusion.productTypeId ? [exclusion.productTypeId] : [],
        ),
        excludedBundleIds: row.exclusions.flatMap((exclusion) => (exclusion.bundleId ? [exclusion.bundleId] : [])),
      },
      effect: row.effect as GetPromotionByIdResponseDto['effect'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
