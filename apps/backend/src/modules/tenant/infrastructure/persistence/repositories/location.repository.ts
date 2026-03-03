import { Injectable } from '@nestjs/common';
import { LocationMapper } from '../mappers/location.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { Location } from 'src/modules/tenant/domain/entities/location.entity';
import { LocationRepositoryPort } from 'src/modules/tenant/domain/ports/location.repository.port';

@Injectable()
export class LocationRepository implements LocationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Location | null> {
    const raw = await this.prisma.client.location.findUnique({ where: { id } });
    if (!raw) return null;
    return LocationMapper.toDomain(raw);
  }

  async save(location: Location): Promise<string> {
    const data = LocationMapper.toPersistence(location);
    await this.prisma.client.location.upsert({
      where: { id: location.id },
      create: data,
      update: data,
    });
    return location.id;
  }
}
