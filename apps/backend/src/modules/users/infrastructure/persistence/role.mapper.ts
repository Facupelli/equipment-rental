import { Role as PrismaRole } from 'src/generated/prisma/client';
import { Prisma } from 'src/generated/prisma/browser';
import { Role } from '../../domain/entities/role.entity';

export class RoleMapper {
  static toDomain(raw: PrismaRole): Role {
    return Role.reconstitute(raw.id, raw.tenantId, raw.name, raw.isSystem, raw.description);
  }

  static toPersistence(role: Role): Prisma.RoleUncheckedCreateInput {
    return {
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      description: role.description,
      tenantId: role.tenantId,
    };
  }
}
