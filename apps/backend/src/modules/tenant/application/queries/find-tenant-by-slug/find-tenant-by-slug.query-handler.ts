import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { FindTenantBySlugQuery } from './find-tenant-by-slug.query';
import { TenantContext } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
@QueryHandler(FindTenantBySlugQuery)
export class FindTenantBySlugQueryHandler implements IQueryHandler<FindTenantBySlugQuery, TenantContext | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindTenantBySlugQuery): Promise<TenantContext | null> {
    const tenant = await this.prisma.client.tenant.findFirst({
      where: {
        slug: query.slug,
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
