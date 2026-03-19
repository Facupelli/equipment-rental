import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLocationsQuery } from './get-locations.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { LocationListResponse } from '@repo/schemas';

@QueryHandler(GetLocationsQuery)
export class GetLocationsQueryHandler implements IQueryHandler<GetLocationsQuery, LocationListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(_query: GetLocationsQuery): Promise<LocationListResponse> {
    return this.prisma.client.location.findMany({
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
