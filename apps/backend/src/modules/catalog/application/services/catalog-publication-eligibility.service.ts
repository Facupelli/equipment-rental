import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';

import { BundleComponent } from '../../domain/entities/bundle-component.entity';
import {
  BundleCannotBePublishedBecauseAComponentHasNoAssetsError,
  BundleCannotBePublishedBecauseAComponentLacksActiveOwnerContractsError,
  ProductTypeCannotBePublishedWithoutActiveOwnerContractsError,
  ProductTypeCannotBePublishedWithoutAssetsError,
} from '../../domain/errors/catalog.errors';
import {
  GetProductTypesAssetOwnershipQuery,
  ProductTypeAssetOwnershipBatchReadModel,
} from 'src/modules/inventory/public/queries/get-product-types-asset-ownership.query';
import {
  ExternalAssetOwnershipReadModel,
  FindAssetsWithoutActiveOwnerContractsQuery,
} from 'src/modules/tenant/public/queries/find-assets-without-active-owner-contracts.query';

type ProductTypePublicationEligibilityError =
  | ProductTypeCannotBePublishedWithoutAssetsError
  | ProductTypeCannotBePublishedWithoutActiveOwnerContractsError;

type BundlePublicationEligibilityError =
  | BundleCannotBePublishedBecauseAComponentHasNoAssetsError
  | BundleCannotBePublishedBecauseAComponentLacksActiveOwnerContractsError;

type ProductTypeAssetOwnership = {
  assetId: string;
  ownerId: string | null;
};

@Injectable()
export class CatalogPublicationEligibilityService {
  constructor(private readonly queryBus: QueryBus) {}

  async ensureProductTypeCanBePublished(
    tenantId: string,
    productTypeId: string,
  ): Promise<Result<void, ProductTypePublicationEligibilityError>> {
    const productTypeAssetRows = await this.getProductTypeAssets(tenantId, [productTypeId]);
    const assets = productTypeAssetRows.get(productTypeId) ?? [];

    if (assets.length === 0) {
      return err(new ProductTypeCannotBePublishedWithoutAssetsError(productTypeId));
    }

    if (assets.some((asset) => asset.ownerId === null)) {
      return ok(undefined);
    }

    const uncoveredAssets = await this.findAssetsWithoutActiveOwnerContracts(tenantId, assets);

    if (uncoveredAssets.length > 0) {
      const firstUncoveredAsset = uncoveredAssets[0];
      return err(
        new ProductTypeCannotBePublishedWithoutActiveOwnerContractsError(
          productTypeId,
          firstUncoveredAsset.assetId,
          firstUncoveredAsset.ownerId,
        ),
      );
    }

    return ok(undefined);
  }

  async ensureBundleCanBePublished(
    tenantId: string,
    bundleId: string,
    components: BundleComponent[],
  ): Promise<Result<void, BundlePublicationEligibilityError>> {
    const componentProductTypeIds = [...new Set(components.map((component) => component.productTypeId))];
    const productTypeAssets = await this.getProductTypeAssets(tenantId, componentProductTypeIds);

    const uncoveredAssets = await this.findAssetsWithoutActiveOwnerContracts(
      tenantId,
      componentProductTypeIds.flatMap((productTypeId) => {
        const assets = productTypeAssets.get(productTypeId) ?? [];

        if (assets.some((asset) => asset.ownerId === null)) {
          return [];
        }

        return assets;
      }),
    );
    const uncoveredAssetIds = new Set(uncoveredAssets.map((asset) => asset.assetId));

    for (const component of components) {
      const assets = productTypeAssets.get(component.productTypeId) ?? [];

      if (assets.length === 0) {
        return err(new BundleCannotBePublishedBecauseAComponentHasNoAssetsError(bundleId, component.productTypeId));
      }

      if (assets.some((asset) => asset.ownerId === null)) {
        continue;
      }

      if (assets.some((asset) => uncoveredAssetIds.has(asset.assetId))) {
        return err(
          new BundleCannotBePublishedBecauseAComponentLacksActiveOwnerContractsError(bundleId, component.productTypeId),
        );
      }
    }

    return ok(undefined);
  }

  private async getProductTypeAssets(
    tenantId: string,
    productTypeIds: string[],
  ): Promise<Map<string, ProductTypeAssetOwnership[]>> {
    const assetRows = await this.queryBus.execute<
      GetProductTypesAssetOwnershipQuery,
      ProductTypeAssetOwnershipBatchReadModel[]
    >(new GetProductTypesAssetOwnershipQuery(tenantId, productTypeIds));

    const assetsByProductTypeId = new Map<string, ProductTypeAssetOwnership[]>();

    for (const productTypeId of productTypeIds) {
      assetsByProductTypeId.set(productTypeId, []);
    }

    for (const assetRow of assetRows) {
      const assetList = assetsByProductTypeId.get(assetRow.productTypeId);
      if (!assetList) {
        continue;
      }

      assetList.push({
        assetId: assetRow.assetId,
        ownerId: assetRow.ownerId,
      });
    }

    return assetsByProductTypeId;
  }

  private async findAssetsWithoutActiveOwnerContracts(
    tenantId: string,
    assets: Array<{ assetId: string; ownerId: string | null }>,
  ): Promise<ExternalAssetOwnershipReadModel[]> {
    const externalAssets = assets.flatMap((asset) =>
      asset.ownerId ? [{ assetId: asset.assetId, ownerId: asset.ownerId }] : [],
    );

    if (externalAssets.length === 0) {
      return [];
    }

    return this.queryBus.execute<FindAssetsWithoutActiveOwnerContractsQuery, ExternalAssetOwnershipReadModel[]>(
      new FindAssetsWithoutActiveOwnerContractsQuery(tenantId, new Date(), externalAssets),
    );
  }
}
