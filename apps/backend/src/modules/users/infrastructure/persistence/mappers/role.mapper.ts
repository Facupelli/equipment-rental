import {
  Role as PrismaRole,
  RolePermission as PrismaRolePermission,
  UserRole as PrismaUserRole,
  Prisma,
} from 'src/generated/prisma/client';
import { Permission } from '@repo/types';
import { Role, RolePermission } from '../../../domain/entities/role.entity';
import { UserRole } from '../../../domain/entities/user-role.entity';

// ---------------------------------------------------------------------------
// RolePermissionMapper
// ---------------------------------------------------------------------------

export class RolePermissionMapper {
  static toDomain(raw: PrismaRolePermission): RolePermission {
    return RolePermission.reconstitute({
      id: raw.id,
      roleId: raw.roleId,
      permission: raw.permission as Permission,
    });
  }

  static toPersistence(entity: RolePermission): Prisma.RolePermissionUncheckedCreateInput {
    return {
      id: entity.id,
      roleId: entity.roleId,
      permission: entity.permission,
    };
  }
}

// ---------------------------------------------------------------------------
// RoleMapper
// ---------------------------------------------------------------------------

type PrismaRoleWithRelations = PrismaRole & {
  permissions: PrismaRolePermission[];
};

export class RoleMapper {
  static toDomain(raw: PrismaRoleWithRelations): Role {
    const permissions = raw.permissions.map(RolePermissionMapper.toDomain);
    return Role.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      description: raw.description,
      isDefault: raw.isDefault,
      permissions,
    });
  }

  static toPersistence(entity: Role): Prisma.RoleUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      description: entity.currentDescription,
      isDefault: entity.default,
    };
  }
}

// ---------------------------------------------------------------------------
// UserRoleMapper
// ---------------------------------------------------------------------------

export class UserRoleMapper {
  static toDomain(raw: PrismaUserRole): UserRole {
    return UserRole.reconstitute({
      id: raw.id,
      userId: raw.userId,
      roleId: raw.roleId,
      locationId: raw.locationId,
    });
  }

  static toPersistence(entity: UserRole): Prisma.UserRoleUncheckedCreateInput {
    return {
      id: entity.id,
      userId: entity.userId,
      roleId: entity.roleId,
      locationId: entity.locationId,
    };
  }
}
