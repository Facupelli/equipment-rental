import { Prisma, Location as PrismaLocation } from 'src/generated/prisma/client';
import { AddressProps, Location } from './entities/location.entity';
import { LocationResponseDto } from '@repo/schemas';

export class LocationMapper {
  static toDomain(raw: PrismaLocation): Location {
    // TODO: validate the structure of this JSON using a library like Zod here.
    const addressProps = raw.address as unknown as AddressProps;

    return Location.reconstitute(
      raw.id,
      raw.tenantId,
      raw.name,
      addressProps,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  static toPersistence(location: Location): Prisma.LocationUncheckedCreateInput {
    return {
      id: location.id,
      name: location.name,
      address: location.address as unknown as Prisma.InputJsonValue,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      tenantId: location.tenantId,
    };
  }

  static toResponse(location: Location): LocationResponseDto {
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      isActive: location.isActive,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }
}
