import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { GetNewArrivalsQuery } from './get-rental-new-arrival.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantPublicApi } from 'src/modules/tenant/tenant.public-api';
import { NewArrivalListResponseDto } from '@repo/schemas';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';

@Injectable()
@QueryHandler(GetNewArrivalsQuery)
export class GetNewArrivalsQueryHandler implements IQueryHandler<GetNewArrivalsQuery, NewArrivalListResponseDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantApi: TenantPublicApi,
  ) {}

  async execute(query: GetNewArrivalsQuery): Promise<NewArrivalListResponseDto> {
    const { locationId } = query;
    const tenantId = this.tenantContext.requireTenantId();

    const config = await this.tenantApi.getConfig(tenantId);
    const windowDays = config.newArrivalsWindowDays;
    const since = new Date();
    since.setDate(since.getDate() - windowDays);

    const productTypes = await this.prisma.client.productType.findMany({
      where: {
        retiredAt: null,
        publishedAt: { not: null, gte: since },
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
        publishedAt: true,
        billingUnit: {
          select: { label: true },
        },
        pricingTiers: {
          where: locationId ? { OR: [{ locationId }, { locationId: null }] } : { locationId: null },
          orderBy: [{ locationId: 'desc' }, { fromUnit: 'asc' }],
          take: 1,
          select: {
            pricePerUnit: true,
            fromUnit: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return productTypes.map((pt) => ({
      id: pt.id,
      name: pt.name,
      categoryId: pt.categoryId,
      publishedAt: pt.publishedAt!,
      billingUnit: pt.billingUnit,
      pricingPreview: pt.pricingTiers[0]
        ? {
            pricePerUnit: Number(pt.pricingTiers[0].pricePerUnit),
            fromUnit: pt.pricingTiers[0].fromUnit,
          }
        : null,
    }));
  }
}
