import { Prisma, Owner as PrismaOwner } from 'src/generated/prisma/client';
import { Owner } from './entities/owner.entity';
import { OwnerResponseDto } from '@repo/schemas';

export class OwnerMapper {
  static toDomain(raw: PrismaOwner): Owner {
    return Owner.reconstitute(raw.id, raw.tenantId, raw.name, raw.createdAt, raw.updatedAt);
  }

  static toPersistence(owner: Owner): Prisma.OwnerUncheckedCreateInput {
    return {
      id: owner.id,
      name: owner.name,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
      tenantId: owner.tenantId,
    };
  }

  static toResponse(owner: Owner): OwnerResponseDto {
    return {
      id: owner.id,
      name: owner.name,
      createdAt: owner.createdAt.toISOString(),
      updatedAt: owner.updatedAt.toISOString(),
    };
  }
}
