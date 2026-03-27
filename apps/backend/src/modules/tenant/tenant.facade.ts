import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';

import { ActiveOwnerContractDto, FindActiveOwnerContractDto, TenantPublicApi } from './tenant.public-api';

@Injectable()
export class TenantFacade implements TenantPublicApi {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveOwnerContract(dto: FindActiveOwnerContractDto): Promise<ActiveOwnerContractDto | null> {
    const { tenantId, ownerId, assetId, date } = dto;

    const candidates = await this.prisma.client.ownerContract.findMany({
      where: {
        tenantId,
        ownerId,
        isActive: true,
        validFrom: { lte: date },
        OR: [{ validUntil: null }, { validUntil: { gte: date } }],
        AND: [{ OR: [{ assetId }, { assetId: null }] }],
      },
      select: {
        id: true,
        ownerId: true,
        assetId: true,
        ownerShare: true,
        rentalShare: true,
        basis: true,
      },
    });

    const assetLevel = candidates.find((candidate) => candidate.assetId === assetId) ?? null;
    const ownerLevel = candidates.find((candidate) => candidate.assetId === null) ?? null;
    const contract = assetLevel ?? ownerLevel;

    if (!contract) {
      return null;
    }

    return {
      contractId: contract.id,
      ownerId: contract.ownerId,
      ownerShare: contract.ownerShare.toString(),
      rentalShare: contract.rentalShare.toString(),
      basis: contract.basis,
    };
  }
}
