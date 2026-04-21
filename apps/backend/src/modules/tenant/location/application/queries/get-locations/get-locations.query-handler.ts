import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LocationListResponse, tenantConfigSchema } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetLocationsQuery } from './get-locations.query';

@QueryHandler(GetLocationsQuery)
export class GetLocationsQueryHandler implements IQueryHandler<GetLocationsQuery, LocationListResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLocationsQuery): Promise<LocationListResponse> {
    return this.prisma.client.location
      .findMany({
        where: { tenantId: query.tenantId },
        select: {
          id: true,
          name: true,
          address: true,
          timezone: true,
          isActive: true,
          supportsDelivery: true,
          deliveryDefaultCountry: true,
          deliveryDefaultStateRegion: true,
          deliveryDefaultCity: true,
          deliveryDefaultPostalCode: true,
          createdAt: true,
          tenant: {
            select: {
              config: true,
            },
          },
        },
      })
      .then((locations) =>
        locations.map((location) => {
          const tenantConfig = tenantConfigSchema.parse(location.tenant.config);

          return {
            id: location.id,
            name: location.name,
            address: location.address,
            timezone: location.timezone,
            effectiveTimezone: location.timezone ?? tenantConfig.timezone,
            isActive: location.isActive,
            supportsDelivery: location.supportsDelivery,
            deliveryDefaults: toDeliveryDefaults(location),
            createdAt: location.createdAt,
          };
        }),
      );
  }
}

function toDeliveryDefaults(location: {
  deliveryDefaultCountry: string | null;
  deliveryDefaultStateRegion: string | null;
  deliveryDefaultCity: string | null;
  deliveryDefaultPostalCode: string | null;
}) {
  const defaults = {
    country: location.deliveryDefaultCountry,
    stateRegion: location.deliveryDefaultStateRegion,
    city: location.deliveryDefaultCity,
    postalCode: location.deliveryDefaultPostalCode,
  };

  return defaults.country || defaults.stateRegion || defaults.city || defaults.postalCode ? defaults : null;
}
