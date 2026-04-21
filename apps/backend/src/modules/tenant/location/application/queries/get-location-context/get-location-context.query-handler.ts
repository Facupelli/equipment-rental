import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { tenantConfigSchema } from '@repo/schemas';

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
    const location = await this.prisma.client.location.findFirst({
      where: {
        id: query.locationId,
        tenantId: query.tenantId,
      },
      select: {
        id: true,
        supportsDelivery: true,
        timezone: true,
        tenant: {
          select: {
            config: true,
          },
        },
      },
    });

    if (!location) {
      return null;
    }

    const tenantConfig = tenantConfigSchema.parse(location.tenant.config);
    const effectiveTimezone = location.timezone ?? tenantConfig.timezone;

    return {
      id: location.id,
      supportsDelivery: location.supportsDelivery,
      effectiveTimezone,
      locationTimezone: location.timezone,
      tenantTimezone: tenantConfig.timezone,
      timezoneSource: location.timezone ? 'LOCATION' : 'TENANT',
    };
  }
}
