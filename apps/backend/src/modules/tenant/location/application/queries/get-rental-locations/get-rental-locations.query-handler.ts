import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RentalLocationsResponse } from '@repo/schemas';

import { PrismaService } from 'src/core/database/prisma.service';

import { GetRentalLocationsQuery } from './get-rental-locations.query';

@QueryHandler(GetRentalLocationsQuery)
export class GetRentalLocationsQueryHandler implements IQueryHandler<GetRentalLocationsQuery, RentalLocationsResponse> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRentalLocationsQuery): Promise<RentalLocationsResponse> {
    return this.prisma.client.location
      .findMany({
        where: {
          tenantId: query.tenantId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          address: true,
          timezone: true,
          supportsDelivery: true,
          deliveryDefaultCountry: true,
          deliveryDefaultStateRegion: true,
          deliveryDefaultCity: true,
          deliveryDefaultPostalCode: true,
          createdAt: true,
        },
      })
      .then((locations) =>
        locations.map((location) => ({
          id: location.id,
          name: location.name,
          address: location.address,
          timezone: location.timezone,
          supportsDelivery: location.supportsDelivery,
          deliveryDefaults: toDeliveryDefaults(location),
          createdAt: location.createdAt,
        })),
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
