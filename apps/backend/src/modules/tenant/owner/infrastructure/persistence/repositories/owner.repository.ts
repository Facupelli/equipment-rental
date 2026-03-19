import { Injectable } from '@nestjs/common';
import { OwnerMapper } from '../mappers/owner.mapper';
import { OwnerRepositoryPort } from 'src/modules/tenant/owner/domain/ports/owner.repository.port';
import { PrismaService } from 'src/core/database/prisma.service';
import { Owner } from '../../../domain/entities/owner.entity';

@Injectable()
export class OwnerRepository implements OwnerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Owner | null> {
    const raw = await this.prisma.client.owner.findUnique({ where: { id } });

    if (!raw) {
      return null;
    }

    return OwnerMapper.toDomain(raw);
  }

  async save(owner: Owner): Promise<string> {
    const data = OwnerMapper.toPersistence(owner);
    await this.prisma.client.owner.upsert({
      where: { id: owner.id },
      create: data,
      update: data,
    });
    return owner.id;
  }
}
