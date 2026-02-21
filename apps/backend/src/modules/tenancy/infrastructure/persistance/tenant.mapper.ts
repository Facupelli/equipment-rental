import { Tenant as PrismaTenant } from 'src/generated/prisma/client';
import { Prisma } from 'src/generated/prisma/browser';
import { Tenant } from '../../domain/entities/tenant.entity';

export class TenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.reconstitute(raw.id, raw.name, raw.slug, raw.planTier, raw.isActive, raw.createdAt);
  }

  static toPersistence(tenant: Tenant): Prisma.TenantCreateInput {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      planTier: tenant.planTier,
      isActive: tenant.isActive,
    };
    // createdAt is intentionally omitted — Prisma lets the DB default handle it
  }
}
