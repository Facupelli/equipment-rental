import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { OwnerContractMapper } from '../mappers/owner-contract.mapper';
import { OwnerContract } from '../../../domain/entities/owner-contract.entity';
import { OwnerContractRepositoryPort } from '../../../domain/ports/owner-contract.repository.port';

@Injectable()
export class OwnerContractRepository implements OwnerContractRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<OwnerContract | null> {
    const raw = await this.prisma.client.ownerContract.findUnique({ where: { id } });

    if (!raw) {
      return null;
    }

    return OwnerContractMapper.toDomain(raw);
  }

  async save(contract: OwnerContract): Promise<string> {
    const data = OwnerContractMapper.toPersistence(contract);

    await this.prisma.client.ownerContract.upsert({
      where: { id: contract.id },
      create: data,
      update: data,
    });

    return contract.id;
  }
}
