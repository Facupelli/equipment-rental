import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';

import { CustomDomainReadModel } from '../../custom-domain.read-model';
import { GetCustomDomainQuery } from './get-custom-domain.query';
import { CustomDomainStatus } from '@repo/types';

@QueryHandler(GetCustomDomainQuery)
export class GetCustomDomainQueryHandler implements IQueryHandler<GetCustomDomainQuery, CustomDomainReadModel | null> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCustomDomainQuery): Promise<CustomDomainReadModel | null> {
    const customDomain = await this.prisma.client.customDomain.findUnique({
      where: { tenantId: query.tenantId },
      select: {
        domain: true,
        status: true,
        verifiedAt: true,
        lastError: true,
      },
    });

    return customDomain
      ? {
          domain: customDomain.domain,
          status: customDomain.status as CustomDomainStatus,
          verifiedAt: customDomain.verifiedAt,
          lastError: customDomain.lastError,
        }
      : null;
  }
}
