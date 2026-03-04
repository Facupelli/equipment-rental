import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTenantBillingUnitsQuery } from './get-tenant-billing-units.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantContextService } from '../../tenant-context.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(_query: GetTenantBillingUnitsQuery): Promise<TenantBillingUnitListItem[]> {
    const tenantId = this.tenantContext.requireTenantId();

    const rows = await this.prisma.client.tenantBillingUnit.findMany({
      where: { tenantId },
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
