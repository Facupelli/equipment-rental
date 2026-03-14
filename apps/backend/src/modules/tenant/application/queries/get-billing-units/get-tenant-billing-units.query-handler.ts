import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTenantBillingUnitsQuery } from './get-tenant-billing-units.query';
import { PrismaService } from 'src/core/database/prisma.service';

export interface TenantBillingUnitListItem {
  id: string;
  billingUnitId: string;
  label: string;
}

@QueryHandler(GetTenantBillingUnitsQuery)
export class GetTenantBillingUnitsQueryHandler implements IQueryHandler<
  GetTenantBillingUnitsQuery,
  TenantBillingUnitListItem[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantBillingUnitsQuery): Promise<TenantBillingUnitListItem[]> {
    const rows = await this.prisma.client.tenantBillingUnit.findMany({
      where: { tenantId: query.tenantId },
      select: {
        id: true,
        billingUnitId: true,
        billingUnit: {
          select: { label: true },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      billingUnitId: row.billingUnitId,
      label: row.billingUnit.label,
    }));
  }
}
