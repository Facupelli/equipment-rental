import { User } from 'src/users/entities/user.entity';
import { User as PrismaUser } from '../../../generated/prisma/client';
import { Prisma } from 'src/generated/prisma/browser';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    const user = new (User as any)(
      raw.id,
      raw.email,
      raw.passwordHash,
      raw.firstName,
      raw.lastName,
      raw.isActive,
      raw.tenantId,
      raw.roleId,
    );

    return user;
  }

  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      tenant: { connect: { id: user.tenantId } },
      role: { connect: { id: user.roleId } },
    };
  }
}
