import { Prisma } from 'src/generated/prisma/client';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRoleMapper } from './role.mapper';

type UserWithRoles = Prisma.UserGetPayload<{
  include: { userRoles: true };
}>;

export class UserMapper {
  static toDomain(raw: UserWithRoles): User {
    const userRoles = raw.userRoles ? raw.userRoles.map((ur) => UserRoleMapper.toDomain(ur)) : [];

    return User.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      email: raw.email,
      passwordHash: raw.passwordHash,
      firstName: raw.firstName,
      lastName: raw.lastName,
      isActive: raw.isActive,
      deletedAt: raw.deletedAt,
      userRoles: userRoles,
    });
  }

  static toPersistence(entity: User): Prisma.UserUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      email: entity.email,
      passwordHash: entity.currentPasswordHash,
      firstName: entity.firstName,
      lastName: entity.lastName,
      isActive: entity.active,
      deletedAt: entity.deletedOn,
    };
  }
}
