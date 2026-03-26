import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { TENANT_ADMIN_PERMISSIONS } from 'src/modules/users/domain/tenant-admin.permissions';
import { TENANT_ADMIN_ROLE_CODE } from 'src/modules/users/domain/role.constants';
import { RoleRepository } from 'src/modules/users/infrastructure/persistence/repositories/role.repository';

import { SyncAdminRolePermissionsCommand } from './sync-admin-role-permissions.command';

@CommandHandler(SyncAdminRolePermissionsCommand)
export class SyncAdminRolePermissionsService implements ICommandHandler<SyncAdminRolePermissionsCommand, number> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(): Promise<number> {
    const adminRoles = await this.roleRepository.findByCode(TENANT_ADMIN_ROLE_CODE);
    let syncedRoles = 0;

    for (const role of adminRoles) {
      let hasChanges = false;

      for (const permission of TENANT_ADMIN_PERMISSIONS) {
        if (role.hasPermission(permission)) {
          continue;
        }

        role.addPermission(permission);
        hasChanges = true;
      }

      if (!hasChanges) {
        continue;
      }

      await this.roleRepository.save(role);
      syncedRoles += 1;
    }

    return syncedRoles;
  }
}
