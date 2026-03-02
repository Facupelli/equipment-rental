import { Prisma } from 'src/generated/prisma/browser';
import { Tenant } from 'src/modules/tenancy/domain/entities/tenant.entity';
import { BillingUnitMapper } from './billing-unit.mapper';

type PrismaTenant = Prisma.TenantGetPayload<{
  include: {
    billingUnits: true;
  };
}>;

export class TenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.reconstitute({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      planTier: raw.planTier, // String from DB
      isActive: raw.isActive,
      config: raw.config as Record<string, any> | null,
      billingUnits: raw.billingUnits.map(BillingUnitMapper.toDomain),
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(entity: Tenant): Prisma.TenantUncheckedCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      planTier: entity.planTier as string,
      isActive: entity.isActive,
      config: entity.config ?? Prisma.DbNull,
      billingUnits: {
        create: entity.billingUnits.map(BillingUnitMapper.toPersistence),
      },
    };
  }
}
