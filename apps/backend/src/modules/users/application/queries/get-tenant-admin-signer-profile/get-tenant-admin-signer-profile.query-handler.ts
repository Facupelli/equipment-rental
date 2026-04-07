import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import { TENANT_ADMIN_ROLE_CODE } from 'src/modules/users/domain/role.constants';
import { GetTenantAdminSignerProfileQuery } from 'src/modules/users/public/queries/get-tenant-admin-signer-profile.query';
import { TenantAdminSignerProfileReadModel } from 'src/modules/users/public/read-models/tenant-admin-signer-profile.read-model';

@QueryHandler(GetTenantAdminSignerProfileQuery)
export class GetTenantAdminSignerProfileQueryHandler implements IQueryHandler<
  GetTenantAdminSignerProfileQuery,
  TenantAdminSignerProfileReadModel | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantAdminSignerProfileQuery): Promise<TenantAdminSignerProfileReadModel | null> {
    const profile = await this.prisma.client.userProfile.findFirst({
      where: {
        user: {
          tenantId: query.tenantId,
          deletedAt: null,
          userRoles: {
            some: {
              role: {
                code: TENANT_ADMIN_ROLE_CODE,
              },
            },
          },
        },
      },
      select: {
        fullName: true,
        documentNumber: true,
        phone: true,
        address: true,
        signUrl: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      fullName: profile.fullName,
      documentNumber: profile.documentNumber,
      phone: profile.phone,
      address: profile.address,
      signUrl: profile.signUrl,
    };
  }
}
