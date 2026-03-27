import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OwnerListResponse } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetOwnersQuery } from './get-owners.query';

@QueryHandler(GetOwnersQuery)
export class GetOwnersQueryHandler implements IQueryHandler<GetOwnersQuery, OwnerListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOwnersQuery): Promise<OwnerListResponse> {
    return this.prisma.client.owner.findMany({
      where: { tenantId: query.tenantId },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
