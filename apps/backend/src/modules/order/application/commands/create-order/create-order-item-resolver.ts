import { Injectable } from '@nestjs/common';

import { CatalogPublicApi } from 'src/modules/catalog/catalog.public-api';
import { PricingPublicApi, ResolvedCouponDto } from 'src/modules/pricing/pricing.public-api';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

import { CreateOrderCommand } from './create-order.command';
import { ResolvedItem } from './create-order.types';
import { BundleNotFoundError, ProductTypeNotFoundError } from '../../../domain/errors/order.errors';

@Injectable()
export class CreateOrderItemResolver {
  constructor(
    private readonly catalogApi: CatalogPublicApi,
    private readonly pricingApi: PricingPublicApi,
  ) {}

  async resolve(
    command: CreateOrderCommand,
    period: DateRange,
    resolvedCoupon: ResolvedCouponDto | undefined,
  ): Promise<ResolvedItem[]> {
    const metadata = await this.loadItemMetadata(command);
    const orderItemCountByCategory = this.buildCategoryCountMap(command, metadata);
    const applicableCouponRuleIds = resolvedCoupon ? [resolvedCoupon.ruleId] : undefined;

    return Promise.all(
      command.items.map((item): Promise<ResolvedItem> => {
        if (item.type === 'PRODUCT') {
          return this.pricingApi
            .calculateProductPrice({
              tenantId: command.tenantId,
              locationId: command.locationId,
              productTypeId: item.productTypeId,
              period,
              currency: command.currency,
              orderItemCountByCategory,
              applicableCouponRuleIds,
              customerId: command.customerId,
            })
            .then((price) => ({
              type: 'PRODUCT' as const,
              productTypeId: item.productTypeId,
              quantity: item.quantity ?? 1,
              assetId: item.assetId,
              locationId: command.locationId,
              period,
              currency: command.currency,
              price,
            }));
        }

        const bundle = metadata.bundles.get(item.bundleId)!;

        return Promise.all([
          this.pricingApi.calculateBundlePrice({
            tenantId: command.tenantId,
            locationId: command.locationId,
            bundleId: item.bundleId,
            period,
            currency: command.currency,
            orderItemCountByCategory,
            applicableCouponRuleIds,
            customerId: command.customerId,
          }),
          this.pricingApi.getComponentStandalonePrices({
            tenantId: command.tenantId,
            locationId: command.locationId,
            componentProductTypeIds: bundle.components.map((component) => component.productTypeId),
            period,
          }),
        ]).then(([price, componentStandalonePrices]) => ({
          type: 'BUNDLE' as const,
          bundleId: item.bundleId,
          bundle,
          locationId: command.locationId,
          period,
          currency: command.currency,
          price,
          componentStandalonePrices,
        }));
      }),
    );
  }

  private async loadItemMetadata(command: CreateOrderCommand) {
    const productTypeIds = command.items
      .filter((item) => item.type === 'PRODUCT')
      .map((item) => (item as { type: 'PRODUCT'; productTypeId: string }).productTypeId);

    const bundleIds = command.items
      .filter((item) => item.type === 'BUNDLE')
      .map((item) => (item as { type: 'BUNDLE'; bundleId: string }).bundleId);

    const [productMetas, bundleMetas] = await Promise.all([
      Promise.all(productTypeIds.map((id) => this.catalogApi.getProductTypeOrderMeta(id))),
      Promise.all(bundleIds.map((id) => this.catalogApi.getBundleOrderMeta(id))),
    ]);

    productTypeIds.forEach((id, index) => {
      if (!productMetas[index]) {
        throw new ProductTypeNotFoundError(id);
      }
    });

    bundleIds.forEach((id, index) => {
      if (!bundleMetas[index]) {
        throw new BundleNotFoundError(id);
      }
    });

    return {
      products: new Map(productTypeIds.map((id, index) => [id, productMetas[index]!])),
      bundles: new Map(bundleIds.map((id, index) => [id, bundleMetas[index]!])),
    };
  }

  private buildCategoryCountMap(
    command: CreateOrderCommand,
    metadata: Awaited<ReturnType<CreateOrderItemResolver['loadItemMetadata']>>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of command.items) {
      if (item.type !== 'PRODUCT') {
        continue;
      }

      const meta = metadata.products.get(item.productTypeId);
      if (!meta?.categoryId) {
        continue;
      }

      counts[meta.categoryId] = (counts[meta.categoryId] ?? 0) + (item.quantity ?? 1);
    }

    return counts;
  }
}
