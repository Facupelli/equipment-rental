import { Injectable } from '@nestjs/common';

import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';

import { BootstrapTenantAdminDto, BootstrapTenantAdminResult } from '../../users.public-api';
import { Role } from '../../domain/entities/role.entity';
import { User } from '../../domain/entities/user.entity';
import { TENANT_ADMIN_ROLE_CODE, TENANT_ADMIN_ROLE_NAME } from '../../domain/role.constants';
import { TENANT_ADMIN_PERMISSIONS } from '../../domain/tenant-admin.permissions';
import { RoleRepository } from '../../infrastructure/persistence/repositories/role.repository';
import { UserRepository } from '../../infrastructure/persistence/repositories/user.repository';

@Injectable()
export class BootstrapTenantAdminService {
  async execute(tx: PrismaTransactionClient, input: BootstrapTenantAdminDto): Promise<BootstrapTenantAdminResult> {
    const roleRepository = new RoleRepository(tx);
    const userRepository = new UserRepository(tx);

    const role = Role.create({
      code: TENANT_ADMIN_ROLE_CODE,
      name: TENANT_ADMIN_ROLE_NAME,
      description: 'Tenant administrator role',
      tenantId: input.tenantId,
    });

    for (const permission of TENANT_ADMIN_PERMISSIONS) {
      const addPermissionResult = role.addPermission(permission);
      if (addPermissionResult.isErr()) {
        throw addPermissionResult.error;
      }
    }

    await roleRepository.save(role);

    const user = User.create({
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      tenantId: input.tenantId,
    });

    const assignRoleResult = user.assignRole({
      userId: user.id,
      roleId: role.id,
    });

    if (assignRoleResult.isErr()) {
      throw assignRoleResult.error;
    }

    await userRepository.save(user);

    return {
      roleId: role.id,
      userId: user.id,
    };
  }
}
