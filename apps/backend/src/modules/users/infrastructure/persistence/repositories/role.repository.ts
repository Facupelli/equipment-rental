import { Injectable } from '@nestjs/common';
import { RoleMapper, RolePermissionMapper } from '../mappers/role.mapper';
import { RoleRepositoryPort } from 'src/modules/users/domain/ports/role.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from 'src/modules/users/domain/entities/role.entity';

@Injectable()
export class RoleRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Role | null> {
    const raw = await this.prisma.client.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!raw) return null;
    return RoleMapper.toDomain(raw);
  }

  async save(role: Role): Promise<string> {
    const rootData = RoleMapper.toPersistence(role);
    const currentPermissions = role.getPermissions();
    const currentPermissionIds = new Set(currentPermissions.map((p) => p.id));

    await this.prisma.client.$transaction(async (tx) => {
      // 1. Upsert the Role root
      await tx.role.upsert({
        where: { id: role.id },
        create: rootData,
        update: rootData,
      });

      // 2. Fetch existing permission ids from DB
      const existing = await tx.rolePermission.findMany({
        where: { roleId: role.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((p) => p.id));

      // 3. Delete permissions no longer in the aggregate
      const toDelete = [...existingIds].filter((id) => !currentPermissionIds.has(id));
      if (toDelete.length > 0) {
        await tx.rolePermission.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // 4. Insert new permissions — immutable once created, only insert new ones
      const toInsert = currentPermissions.filter((p) => !existingIds.has(p.id));
      for (const permission of toInsert) {
        const data = RolePermissionMapper.toPersistence(permission);
        await tx.rolePermission.upsert({
          where: { id: permission.id },
          create: data,
          update: data,
        });
      }
    });

    return role.id;
  }
}
