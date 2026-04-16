import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CouponView, PaginatedDto } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';
import { ListCouponsQuery } from './list-coupons.query';

@QueryHandler(ListCouponsQuery)
export class ListCouponsHandler implements IQueryHandler<ListCouponsQuery, PaginatedDto<CouponView>> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListCouponsQuery): Promise<PaginatedDto<CouponView>> {
    const { tenantId, page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search && {
        code: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          maxUses: true,
          maxUsesPerCustomer: true,
          validFrom: true,
          validUntil: true,
          isActive: true,
          pricingRuleId: true,
          _count: {
            select: {
              redemptions: {
                where: { voidedAt: null },
              },
            },
          },
        },
      }),
      this.prisma.client.coupon.count({ where }),
    ]);

    const promotionIds = [...new Set(rows.map((row) => row.pricingRuleId))];
    const promotions = await this.prisma.client.promotion.findMany({
      where: { id: { in: promotionIds } },
      select: { id: true, name: true },
    });
    const promotionNameById = new Map(promotions.map((promotion) => [promotion.id, promotion.name]));

    const data: CouponView[] = rows.map((row) => ({
      id: row.id,
      code: row.code,
      promotionName: promotionNameById.get(row.pricingRuleId) ?? 'Unknown promotion',
      maxUses: row.maxUses,
      maxUsesPerCustomer: row.maxUsesPerCustomer,
      totalRedemptions: row._count.redemptions,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      isActive: row.isActive,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
