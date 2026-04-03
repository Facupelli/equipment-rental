import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RentalLocationsResponse } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetRentalLocationsQuery } from './get-rental-locations.query';

@QueryHandler(GetRentalLocationsQuery)
export class GetRentalLocationsQueryHandler implements IQueryHandler<GetRentalLocationsQuery, RentalLocationsResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRentalLocationsQuery): Promise<RentalLocationsResponse> {
    return this.prisma.client.location.findMany({
      where: {
        tenantId: query.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
      },
    });
  }
}
