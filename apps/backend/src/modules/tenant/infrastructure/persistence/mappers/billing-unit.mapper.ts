import { BillingUnit } from 'src/modules/tenant/domain/entities/billing-unit.entity';
import { BillingUnit as PrismaBillingUnit } from 'src/generated/prisma/client';

export class BillingUnitMapper {
  static toDomain(raw: PrismaBillingUnit): BillingUnit {
    return BillingUnit.reconstitute({
      id: raw.id,
      label: raw.label,
      durationMinutes: raw.durationMinutes,
      sortOrder: raw.sortOrder,
    });
  }

  static toPersistence(entity: BillingUnit): PrismaBillingUnit {
    return {
      id: entity.id,
      label: entity.label,
      durationMinutes: entity.durationMinutes,
      sortOrder: entity.sortOrder,
    };
  }
}
