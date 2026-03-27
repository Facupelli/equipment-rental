import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedDto, PricingRuleView } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';
import { ListPricingRulesQuery } from './list-pricing-rules.query';

@QueryHandler(ListPricingRulesQuery)
export class ListPricingRulesHandler implements IQueryHandler<ListPricingRulesQuery, PaginatedDto<PricingRuleView>> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPricingRulesQuery): Promise<PaginatedDto<PricingRuleView>> {
    const { tenantId, page, limit, search, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      ...(type && { type }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.pricingRule.findMany({
        where,
        orderBy: { priority: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          scope: true,
          condition: true,
          effect: true,
          priority: true,
          stackable: true,
          isActive: true,
        },
      }),
      this.prisma.client.pricingRule.count({ where }),
    ]);

    return {
      data: rows as PricingRuleView[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
