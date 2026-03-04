import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import { UserRoleMapper } from '../mappers/role.mapper';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<User | null> {
    const raw = await this.prisma.client.user.findUnique({
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

    await this.prisma.client.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: user.id },
        create: rootData,
        update: rootData,
      });

      const existing = await tx.userRole.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((r) => r.id));

      const toDelete = [...existingIds].filter((id) => !currentRoleIds.has(id));
      if (toDelete.length > 0) {
        await tx.userRole.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      for (const role of currentRoles) {
        const roleData = UserRoleMapper.toPersistence(role);

        await tx.userRole.upsert({
          where: { id: role.id },
          create: roleData,
          update: roleData,
        });
      }
    });

    return user.id;
  }
}
