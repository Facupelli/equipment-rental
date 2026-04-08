import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import {
  GetLocationContextQuery,
  LocationContextReadModel,
} from 'src/modules/tenant/public/queries/get-location-context.query';

@QueryHandler(GetLocationContextQuery)
export class GetLocationContextQueryHandler implements IQueryHandler<
  GetLocationContextQuery,
  LocationContextReadModel | null
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLocationContextQuery): Promise<LocationContextReadModel | null> {
    return this.prisma.client.location.findFirst({
      where: {
        id: query.locationId,
        tenantId: query.tenantId,
      },
      select: {
        id: true,
        supportsDelivery: true,
      },
    });
  }
}
