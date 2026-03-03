import { Location as PrismaLocation, Prisma } from 'src/generated/prisma/client';
import { Location } from 'src/modules/tenant/domain/entities/location.entity';

export class LocationMapper {
  static toDomain(raw: PrismaLocation): Location {
    return Location.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      address: raw.address,
      isActive: raw.isActive,
    });
  }

  static toPersistence(entity: Location): Prisma.LocationUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      address: entity.address,
      isActive: entity.active,
    };
  }
}
