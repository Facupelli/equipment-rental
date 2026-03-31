import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';

import { UserPermissionsReadModel } from '../../../public/read-models/user-permissions.read-model';
import { GetUserPermissionsQuery } from '../../../public/queries/get-user-permissions.query';

@QueryHandler(GetUserPermissionsQuery)
export class GetUserPermissionsQueryHandler implements IQueryHandler<
  GetUserPermissionsQuery,
  UserPermissionsReadModel | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserPermissionsQuery): Promise<UserPermissionsReadModel | null> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        id: query.userId,
        tenantId: query.tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        userRoles: {
          select: {
            role: {
              select: {
                permissions: {
                  select: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const permissions = [
      ...new Set(user.userRoles.flatMap((userRole) => userRole.role.permissions.map((entry) => entry.permission))),
    ];

    return {
      userId: user.id,
      permissions: permissions as Permission[],
    };
  }
}
