import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { OwnerContractMapper } from '../mappers/owner-contract.mapper';
import { OwnerContract } from '../../../domain/entities/owner-contract.entity';

@Injectable()
export class OwnerContractRepository {
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

  /**
   * Returns true if an active contract already exists for the given
   * owner + asset scope that overlaps with the proposed validity window.
   *
   * Used exclusively by CreateOwnerContractHandler as a write-side guard.
   */
  async hasOverlappingContract(
    tenantId: string,
    ownerId: string,
    assetId: string | null,
    validFrom: Date,
    validUntil: Date | null,
  ): Promise<boolean> {
    const conflict = await this.prisma.client.ownerContract.findFirst({
      where: {
        tenantId,
        ownerId,
        assetId: assetId ?? null,
        isActive: true,
        // Existing contract overlaps if it starts before our end (or we have no end)
        // AND it ends after our start (or it has no end)
        validFrom: validUntil ? { lte: validUntil } : undefined,
        OR: [{ validUntil: null }, { validUntil: { gte: validFrom } }],
      },
      select: { id: true },
    });

    return conflict !== null;
  }
}
