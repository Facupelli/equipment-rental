import { TenantRepositoryPort } from 'src/modules/tenant/domain/ports/tenant.repository.port';
import { TenantBillingUnitMapper, TenantMapper } from '../mappers/tenant.mapper';
import { Tenant } from 'src/modules/tenant/domain/entities/tenant.entity';

export class TenantRepository implements TenantRepositoryPort {
  constructor(private readonly db: any) {}

  async load(id: string): Promise<Tenant | null> {
    const raw = await this.db.tenant.findUnique({
      where: { id },
      include: { billingUnits: true },
    });
    if (!raw) {
      return null;
    }
    return TenantMapper.toDomain(raw);
  }

  async save(tenant: Tenant): Promise<string> {
    const rootData = TenantMapper.toPersistence(tenant);
    const currentUnits = tenant.getActiveBillingUnits();
    const currentUnitIds = new Set(currentUnits.map((u) => u.id));

    const persist = async (db: any) => {
      await db.tenant.upsert({
        where: { id: tenant.id },
        create: rootData,
        update: rootData,
      });

      const existing = await db.tenantBillingUnit.findMany({
        where: { tenantId: tenant.id },
        select: { id: true },
      });
      const existingIds = new Set<string>(existing.map((u: { id: string }) => u.id));

      const toDelete = [...existingIds].filter((id: string) => !currentUnitIds.has(id));
      if (toDelete.length > 0) {
        await db.tenantBillingUnit.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      const toUpsert = currentUnits.filter((u) => !existingIds.has(u.id));
      for (const unit of toUpsert) {
        const data = TenantBillingUnitMapper.toPersistence(unit);
        await db.tenantBillingUnit.upsert({
          where: { id: unit.id },
          create: data,
          update: data,
        });
      }
    };

    if ('$transaction' in this.db && typeof this.db.$transaction === 'function') {
      await this.db.$transaction(async (tx: any) => persist(tx));
    } else {
      await persist(this.db);
    }

    return tenant.id;
  }
}
