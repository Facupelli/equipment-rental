import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { TENANT_ADMIN_PERMISSIONS } from 'src/modules/users/domain/tenant-admin.permissions';
import { TENANT_ADMIN_ROLE_CODE } from 'src/modules/users/domain/role.constants';
import { DuplicateRolePermissionError } from 'src/modules/users/domain/errors/users.errors';
import { RoleRepository } from 'src/modules/users/infrastructure/persistence/repositories/role.repository';

import { SyncAdminRolePermissionsCommand } from './sync-admin-role-permissions.command';

@CommandHandler(SyncAdminRolePermissionsCommand)
export class SyncAdminRolePermissionsService implements ICommandHandler<
  SyncAdminRolePermissionsCommand,
  Result<number, DuplicateRolePermissionError>
> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(): Promise<Result<number, DuplicateRolePermissionError>> {
    const adminRoles = await this.roleRepository.findByCodeAcrossTenants(TENANT_ADMIN_ROLE_CODE);
    let syncedRoles = 0;

    for (const role of adminRoles) {
      let hasChanges = false;

      for (const permission of TENANT_ADMIN_PERMISSIONS) {
        if (role.hasPermission(permission)) {
          continue;
        }

        const addPermissionResult = role.addPermission(permission);
        if (addPermissionResult.isErr()) {
          return err(addPermissionResult.error);
        }
        hasChanges = true;
      }

      if (!hasChanges) {
        continue;
      }

      await this.roleRepository.save(role);
      syncedRoles += 1;
    }

    return ok(syncedRoles);
  }
}
