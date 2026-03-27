import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserRoleMapper } from '../mappers/role.mapper';

export class UserRepository {
  constructor(private readonly db: any) {}

  async load(id: string): Promise<User | null> {
    const raw = await this.db.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!raw) {
      return null;
    }

    return UserMapper.toDomain(raw);
  }

  async save(user: User): Promise<string> {
    const rootData = UserMapper.toPersistence(user);
    const currentRoles = user.roles;
    const currentRoleIds = new Set(currentRoles.map((r) => r.id));

    const persist = async (db: any) => {
      await db.user.upsert({
        where: { id: user.id },
        create: rootData,
        update: rootData,
      });

      const existing = await db.userRole.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      const existingIds = new Set<string>(existing.map((r: { id: string }) => r.id));

      const toDelete = [...existingIds].filter((id: string) => !currentRoleIds.has(id));
      if (toDelete.length > 0) {
        await db.userRole.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      for (const role of currentRoles) {
        const roleData = UserRoleMapper.toPersistence(role);

        await db.userRole.upsert({
          where: { id: role.id },
          create: roleData,
          update: roleData,
        });
      }
    };

    if ('$transaction' in this.db && typeof this.db.$transaction === 'function') {
      await this.db.$transaction(async (tx: any) => persist(tx));
    } else {
      await persist(this.db);
    }

    return user.id;
  }
}
