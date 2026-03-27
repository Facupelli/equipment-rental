import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LocationListResponse } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetLocationsQuery } from './get-locations.query';

@QueryHandler(GetLocationsQuery)
export class GetLocationsQueryHandler implements IQueryHandler<GetLocationsQuery, LocationListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLocationsQuery): Promise<LocationListResponse> {
    return this.prisma.client.location.findMany({
      where: { tenantId: query.tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
