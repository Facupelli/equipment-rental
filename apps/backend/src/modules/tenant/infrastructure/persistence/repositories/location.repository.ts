import { Injectable } from '@nestjs/common';
import { LocationMapper, LocationScheduleMapper } from '../mappers/location.mapper';
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
    const client = this.prisma.client;

    await client.$transaction(async (tx) => {
      await tx.locationSchedule.deleteMany({
        where: { locationId: location.id },
      });

      await tx.location.upsert({
        where: { id: location.id },
        create: LocationMapper.toPersistence(location),
        update: LocationMapper.toUpdatePersistence(location),
      });

      if (location.getSchedules().length > 0) {
        await tx.locationSchedule.createMany({
          data: location.getSchedules().map(LocationScheduleMapper.toPersistence),
        });
      }
    });

    return location.id;
  }
}
