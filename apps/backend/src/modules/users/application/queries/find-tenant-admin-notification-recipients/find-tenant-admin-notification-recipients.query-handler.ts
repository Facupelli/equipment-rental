import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import { TENANT_ADMIN_ROLE_CODE } from 'src/modules/users/domain/role.constants';
import { FindTenantAdminNotificationRecipientsQuery } from 'src/modules/users/public/queries/find-tenant-admin-notification-recipients.query';
import { TenantAdminNotificationRecipientReadModel } from 'src/modules/users/public/read-models/tenant-admin-notification-recipient.read-model';

@Injectable()
@QueryHandler(FindTenantAdminNotificationRecipientsQuery)
export class FindTenantAdminNotificationRecipientsQueryHandler implements IQueryHandler<
  FindTenantAdminNotificationRecipientsQuery,
  TenantAdminNotificationRecipientReadModel[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: FindTenantAdminNotificationRecipientsQuery,
  ): Promise<TenantAdminNotificationRecipientReadModel[]> {
    const users = await this.prisma.client.user.findMany({
      where: {
        tenantId: query.tenantId,
        deletedAt: null,
        isActive: true,
        userRoles: {
          some: {
            role: {
              code: TENANT_ADMIN_ROLE_CODE,
            },
          },
        },
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
      distinct: ['email'],
    });

    return users.map((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.trim();

      return {
        email: user.email,
        name: fullName.length > 0 ? fullName : undefined,
      };
    });
  }
}
