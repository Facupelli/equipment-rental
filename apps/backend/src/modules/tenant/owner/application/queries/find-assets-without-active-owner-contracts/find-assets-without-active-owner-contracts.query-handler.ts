import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from 'src/core/database/prisma.service';
import {
  ExternalAssetOwnershipReadModel,
  FindAssetsWithoutActiveOwnerContractsQuery,
} from 'src/modules/tenant/public/queries/find-assets-without-active-owner-contracts.query';

@QueryHandler(FindAssetsWithoutActiveOwnerContractsQuery)
export class FindAssetsWithoutActiveOwnerContractsQueryHandler implements IQueryHandler<
  FindAssetsWithoutActiveOwnerContractsQuery,
  ExternalAssetOwnershipReadModel[]
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: FindAssetsWithoutActiveOwnerContractsQuery): Promise<ExternalAssetOwnershipReadModel[]> {
    if (query.assets.length === 0) {
      return [];
    }

    const uniqueOwnerIds = [...new Set(query.assets.map((asset) => asset.ownerId))];
    const uniqueAssetIds = [...new Set(query.assets.map((asset) => asset.assetId))];

    const contracts = await this.prisma.client.ownerContract.findMany({
      where: {
        tenantId: query.tenantId,
        ownerId: { in: uniqueOwnerIds },
        isActive: true,
        validFrom: { lte: query.date },
        OR: [{ validUntil: null }, { validUntil: { gte: query.date } }],
        AND: [{ OR: [{ assetId: { in: uniqueAssetIds } }, { assetId: null }] }],
      },
      select: {
        ownerId: true,
        assetId: true,
      },
    });

    const contractAssetKeys = new Set(
      contracts
        .filter((contract) => contract.assetId !== null)
        .map((contract) => `${contract.ownerId}:${contract.assetId}`),
    );
    const ownerLevelContractOwnerIds = new Set(
      contracts.filter((contract) => contract.assetId === null).map((contract) => contract.ownerId),
    );

    return query.assets.filter(
      (asset) =>
        !contractAssetKeys.has(`${asset.ownerId}:${asset.assetId}`) && !ownerLevelContractOwnerIds.has(asset.ownerId),
    );
  }
}
