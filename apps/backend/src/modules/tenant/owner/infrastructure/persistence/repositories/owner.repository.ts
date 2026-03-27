import { Injectable } from '@nestjs/common';
import { OwnerMapper } from '../mappers/owner.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { Owner } from '../../../domain/entities/owner.entity';

@Injectable()
export class OwnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string, tenantId?: string): Promise<Owner | null> {
    const raw = await this.prisma.client.owner.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });

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
