import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserReadService, UserRepositoryPort } from 'src/modules/users/domain/ports/user.repository.port';
import { UserCredentials } from 'src/modules/users/application/users-public-api';
import { MeResponseDto } from '@repo/schemas';
import { UserRoleMapper } from '../mappers/role.mapper';

@Injectable()
export class UserRepository implements UserRepositoryPort, UserReadService {
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

  // read service

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const user = await this.prisma.client.user.findFirst({
      where: { email, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        email: true,
        passwordHash: true,
        isActive: true,
        userRoles: {
          select: {
            locationId: true,
            role: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
      })),
    };
  }

  async findById(id: string): Promise<MeResponseDto | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            location: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.firstName + ' ' + user.lastName,
      isActive: user.isActive,
      tenantId: user.tenantId,
      roles: user.userRoles.map((ur) => ({
        roleId: ur.role.id,
        roleName: ur.role.name,
        locationId: ur.locationId,
      })),
    };
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const count = await this.prisma.client.user.count({ where: { email } });
    return count > 0;
  }
}
