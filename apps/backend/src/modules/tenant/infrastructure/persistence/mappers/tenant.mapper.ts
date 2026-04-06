import { InputJsonValue } from '@prisma/client/runtime/client';
import {
  Tenant as PrismaTenant,
  TenantBillingUnit as PrismaTenantBillingUnit,
  Prisma,
} from 'src/generated/prisma/client';
import { TenantBillingUnit } from 'src/modules/tenant/domain/entities/tenant-billing-unit.entity';
import { Tenant } from 'src/modules/tenant/domain/entities/tenant.entity';
import { TenantConfig, TenantConfigProps } from 'src/modules/tenant/domain/value-objects/tenant-config.value-object';

type PrismaTenantWithRelations = PrismaTenant & {
  billingUnits: PrismaTenantBillingUnit[];
};

export class TenantMapper {
  static toDomain(raw: PrismaTenantWithRelations): Tenant {
    const billingUnits = raw.billingUnits.map(TenantBillingUnitMapper.toDomain);
    return Tenant.reconstitute({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      logoUrl: raw.logoUrl,
      faviconUrl: raw.faviconUrl,
      config: TenantConfig.reconstitute(raw.config as unknown as TenantConfigProps),
      billingUnits,
    });
  }

  static toPersistence(entity: Tenant): Prisma.TenantUncheckedCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      logoUrl: entity.getLogoUrl(),
      faviconUrl: entity.getFaviconUrl(),
      config: entity.getConfig().toPlainObject() as unknown as InputJsonValue,
    };
  }
}

export class TenantBillingUnitMapper {
  static toDomain(raw: PrismaTenantBillingUnit): TenantBillingUnit {
    return TenantBillingUnit.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      billingUnitId: raw.billingUnitId,
    });
  }

  static toPersistence(entity: TenantBillingUnit): Prisma.TenantBillingUnitUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      billingUnitId: entity.billingUnitId,
    };
  }
}
