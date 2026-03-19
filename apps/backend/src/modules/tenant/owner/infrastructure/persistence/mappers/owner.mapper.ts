import { Owner as PrismaOwner, Prisma } from 'src/generated/prisma/client';
import { Owner } from '../../../domain/entities/owner.entity';

export class OwnerMapper {
  static toDomain(raw: PrismaOwner): Owner {
    return Owner.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      notes: raw.notes,
      isActive: raw.isActive,
    });
  }

  static toPersistence(entity: Owner): Prisma.OwnerUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      notes: entity.notes,
      isActive: entity.active,
    };
  }
}
