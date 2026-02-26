import { User } from 'src/modules/users/domain/entities/user.entity';
import { User as PrismaUser } from '../../../../generated/prisma/client';
import { Prisma } from 'src/generated/prisma/browser';
import { MeResponseDto } from '@repo/schemas';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    const user = User.reconstitute(
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

  static toPersistence(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      tenantId: user.tenantId,
      roleId: user.roleId,
    };
  }

  static toResponse(user: User): MeResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      tenantId: user.tenantId,
      roleId: user.roleId,
    };
  }
}
