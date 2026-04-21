import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantContext } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';

import { FindTenantByIdQuery } from '../../../public/queries/find-tenant-by-id.query';

@Injectable()
@QueryHandler(FindTenantByIdQuery)
export class FindTenantByIdQueryHandler implements IQueryHandler<FindTenantByIdQuery, TenantContext | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindTenantByIdQuery): Promise<TenantContext | null> {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: {
        id: query.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        customDomain: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
      },
    });

    return tenant ?? null;
  }
}
