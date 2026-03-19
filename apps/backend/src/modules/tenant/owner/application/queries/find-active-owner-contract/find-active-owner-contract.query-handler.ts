import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActiveContractDto, FindActiveContractForScopeQuery } from './find-active-owner-contract.query';

@QueryHandler(FindActiveContractForScopeQuery)
export class OwnerContractQueryService implements IQueryHandler<FindActiveContractForScopeQuery> {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the applicable contract for a given asset at a given date.
   * Follows the fallback chain: asset-level contract → owner-level default → null.
   *
   * Called by the order module via QueryBus at asset assignment time.
   */
  async execute(query: FindActiveContractForScopeQuery): Promise<ActiveContractDto | null> {
    const { tenantId, ownerId, assetId, date } = query;

    const candidates = await this.prisma.client.ownerContract.findMany({
      where: {
        tenantId,
        ownerId,
        isActive: true,
        validFrom: { lte: date },
        OR: [{ validUntil: null }, { validUntil: { gte: date } }],
        AND: [
          {
            OR: [{ assetId: assetId }, { assetId: null }],
          },
        ],
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

    // Asset-level contract takes precedence over owner-level default
    const assetLevel = candidates.find((c) => c.assetId === assetId) ?? null;
    const ownerLevel = candidates.find((c) => c.assetId === null) ?? null;
    const contract = assetLevel ?? ownerLevel;

    if (!contract) return null;

    return {
      contractId: contract.id,
      ownerId: contract.ownerId,
      ownerShare: contract.ownerShare.toString(),
      rentalShare: contract.rentalShare.toString(),
      basis: contract.basis,
    };
  }
}
