import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { FindTenantByCustomDomainQuery } from '../../../public/queries/find-tenant-by-custom-domain.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { TenantContext } from '@repo/schemas';

@Injectable()
@QueryHandler(FindTenantByCustomDomainQuery)
export class FindTenantByCustomDomainQueryHandler implements IQueryHandler<
  FindTenantByCustomDomainQuery,
  TenantContext | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindTenantByCustomDomainQuery): Promise<TenantContext | null> {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: {
        customDomain: query.domain,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        customDomain: true,
        logoUrl: true,
        primaryColor: true,
      },
    });

    return tenant ?? null;
  }
}
