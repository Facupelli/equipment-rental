import { Tenant, TenantProps } from '../../domain/entities/tenant.entity';
import { BillingUnit } from '../../domain/entities/billing-unit.entity';
import { Prisma, BillingUnit as PrismaBillingUnit } from 'src/generated/prisma/client';
import { TenantPricingConfig } from '../../domain/value-objects/pricing-config.type';

export class TenantMapper {
  static toDomain(raw: any): Tenant {
    const props: TenantProps = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      planTier: raw.planTier,
      isActive: raw.isActive,
      pricingConfig: raw.pricingConfig as TenantPricingConfig,
      billingUnits: raw.billingUnits.map(TenantMapper.billingUnitToDomain),
      createdAt: raw.createdAt,
    };

    return Tenant.reconstitute(props);
  }

  static toPersistence(entity: Tenant): Prisma.TenantUncheckedCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      planTier: entity.planTier,
      isActive: entity.isActive,
      pricingConfig: entity.pricingConfig as unknown as Prisma.InputJsonValue,
      createdAt: entity.createdAt,
      billingUnits: {
        create: entity.billingUnits.map(TenantMapper.billingUnitToPersistenceCreate),
      },
    };
  }

  private static billingUnitToDomain(prismaUnit: PrismaBillingUnit): BillingUnit {
    return BillingUnit.reconstitute({
      id: prismaUnit.id,
      tenantId: prismaUnit.tenantId,
      name: prismaUnit.name,
      durationHours: prismaUnit.durationHours.toNumber(),
      sortOrder: prismaUnit.sortOrder,
      createdAt: prismaUnit.createdAt,
      updatedAt: prismaUnit.updatedAt,
    });
  }

  private static billingUnitToPersistenceCreate(
    unit: BillingUnit,
  ): Prisma.BillingUnitUncheckedCreateWithoutTenantInput {
    return {
      id: unit.id,
      name: unit.name,
      durationHours: unit.durationHours,
      sortOrder: unit.sortOrder,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
