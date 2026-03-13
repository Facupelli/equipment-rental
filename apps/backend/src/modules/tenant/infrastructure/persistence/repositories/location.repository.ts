import { Injectable } from '@nestjs/common';
import { LocationMapper } from '../mappers/location.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { Location } from 'src/modules/tenant/domain/entities/location.entity';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';

@Injectable()
export class LocationRepository implements LocationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Location | null> {
    const raw = await this.prisma.client.location.findUnique({
      where: { id },
      include: { schedules: true },
    });

    if (!raw) {
      return null;
    }

    return LocationMapper.toDomain(raw);
  }

  async save(location: Location): Promise<string> {
    await this.prisma.client.$transaction([
      this.prisma.client.locationSchedule.deleteMany({
        where: { locationId: location.id },
      }),

      this.prisma.client.location.upsert({
        where: { id: location.id },
        create: LocationMapper.toPersistence(location),
        update: LocationMapper.toUpdatePersistence(location),
      }),
    ]);

    return location.id;
  }
}
