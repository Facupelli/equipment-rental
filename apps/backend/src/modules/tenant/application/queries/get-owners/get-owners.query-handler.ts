export class GetOwnersQuery {}
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OwnerListResponse } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';

@QueryHandler(GetOwnersQuery)
export class GetOwnersQueryHandler implements IQueryHandler<GetOwnersQuery, OwnerListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(_: GetOwnersQuery): Promise<OwnerListResponse> {
    return this.prisma.client.owner.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
