import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ActorType, Permission } from '@repo/types';

import { REQUIRED_PERMISSIONS_KEY } from 'src/core/decorators/required-permissions.decorator';
import { GetUserPermissionsQuery } from 'src/modules/users/public/queries/get-user-permissions.query';
import { UserPermissionsReadModel } from 'src/modules/users/public/read-models/user-permissions.read-model';

import { AuthenticatedUser } from '../../public/authenticated-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;

    if (!user || user.actorType !== ActorType.USER) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    const permissionContext = await this.queryBus.execute<GetUserPermissionsQuery, UserPermissionsReadModel | null>(
      new GetUserPermissionsQuery(user.id, user.tenantId),
    );

    if (!permissionContext) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    const grantedPermissions = new Set(permissionContext.permissions);
    const hasAllPermissions = requiredPermissions.every((permission) => grantedPermissions.has(permission));

    if (!hasAllPermissions) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
