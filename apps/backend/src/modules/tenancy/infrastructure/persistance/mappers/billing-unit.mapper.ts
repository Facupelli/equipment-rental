import Decimal from 'decimal.js';
import { Prisma, BillingUnit as PrismaBillingUnit } from 'src/generated/prisma/client';
import { BillingUnit } from 'src/modules/tenancy/domain/entities/billing-unit.entity';

export class BillingUnitMapper {
  static toDomain(raw: PrismaBillingUnit): BillingUnit {
    // Mapper responsibility: Convert Prisma Decimal to Domain number
    const duration = raw.durationHours.toNumber();

    return BillingUnit.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      durationHours: duration,
      sortOrder: raw.sortOrder,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(entity: BillingUnit): Prisma.BillingUnitUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      // Mapper responsibility: Convert Domain number to Prisma Decimal
      durationHours: new Decimal(entity.durationHours),
      sortOrder: entity.sortOrder,
    };
  }
}
