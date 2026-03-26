import { RoleMapper, RolePermissionMapper } from '../mappers/role.mapper';
import { RoleRepositoryPort } from 'src/modules/users/domain/ports/role.repository.port';
import { Role } from 'src/modules/users/domain/entities/role.entity';

export class RoleRepository implements RoleRepositoryPort {
  constructor(private readonly db: any) {}

  async load(id: string): Promise<Role | null> {
    const raw = await this.db.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!raw) return null;
    return RoleMapper.toDomain(raw as unknown as Parameters<typeof RoleMapper.toDomain>[0]);
  }

  async findByCode(code: string): Promise<Role[]> {
    const rows = await this.db.role.findMany({
      where: { code },
      include: { permissions: true },
    });

    return rows.map((row: unknown) => RoleMapper.toDomain(row as Parameters<typeof RoleMapper.toDomain>[0]));
  }

  async save(role: Role): Promise<string> {
    const rootData = RoleMapper.toPersistence(role);
    const currentPermissions = role.getPermissions();
    const currentPermissionIds = new Set(currentPermissions.map((p) => p.id));

    const persist = async (db: any) => {
      // 1. Upsert the Role root
      await db.role.upsert({
        where: { id: role.id },
        create: rootData,
        update: rootData,
      });

      // 2. Fetch existing permission ids from DB
      const existing = await db.rolePermission.findMany({
        where: { roleId: role.id },
        select: { id: true },
      });
      const existingIds = new Set<string>(existing.map((p: { id: string }) => p.id));

      // 3. Delete permissions no longer in the aggregate
      const toDelete = [...existingIds].filter((id: string) => !currentPermissionIds.has(id));
      if (toDelete.length > 0) {
        await db.rolePermission.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // 4. Insert new permissions — immutable once created, only insert new ones
      const toInsert = currentPermissions.filter((p) => !existingIds.has(p.id));
      for (const permission of toInsert) {
        const data = RolePermissionMapper.toPersistence(permission);
        await db.rolePermission.upsert({
          where: { id: permission.id },
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

    return role.id;
  }
}
