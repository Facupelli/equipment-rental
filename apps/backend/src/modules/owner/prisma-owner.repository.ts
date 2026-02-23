import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Owner } from './entities/owner.entity';
import { OwnerRepositoryPort } from './ports/owner-repository.port';
import { OwnerMapper } from './owner.mapper';

@Injectable()
export class PrismaOwnerRepository implements OwnerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(owner: Owner): Promise<string> {
    const data = OwnerMapper.toPersistence(owner);

    const result = await this.prisma.client.owner.upsert({
      where: { id: owner.id },
      update: {
        name: data.name,
        updatedAt: data.updatedAt,
      },
      create: data,
    });

    return result.id;
  }

  async findOne(id: string): Promise<Owner | null> {
    const record = await this.prisma.client.owner.findFirst({
      where: {
        id,
      },
    });

    if (!record) {
      return null;
    }

    return OwnerMapper.toDomain(record);
  }

  async findAll(): Promise<Owner[]> {
    const records = await this.prisma.client.owner.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => OwnerMapper.toDomain(record));
  }
}
