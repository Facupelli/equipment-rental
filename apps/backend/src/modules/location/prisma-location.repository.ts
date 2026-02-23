import { Injectable } from '@nestjs/common';
import { LocationMapper } from './location.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { LocationRepositoryPort } from './ports/location.repository';
import { Location } from './entities/location.entity';

@Injectable()
export class PrismaLocationRepository implements LocationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(location: Location): Promise<string> {
    const data = LocationMapper.toPersistence(location);

    const result = await this.prisma.client.location.upsert({
      where: { id: location.id },
      update: {
        tenantId: data.tenantId,
        name: data.name,
        address: data.address,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
      create: data,
    });

    return result.id;
  }

  async findOne(id: string): Promise<Location | null> {
    const record = await this.prisma.client.location.findFirst({
      where: {
        id,
      },
    });

    if (!record) return null;

    return LocationMapper.toDomain(record);
  }

  async findAll(): Promise<Location[]> {
    const records = await this.prisma.client.location.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => LocationMapper.toDomain(record));
  }
}
