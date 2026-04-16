import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

import {
  BundleBookingEligibilityDto,
  CatalogPublicApi,
  ProductTypeBookingEligibilityDto,
} from 'src/modules/catalog/catalog.public-api';
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
    bookingCreatedAt: Date,
    resolvedCoupon: ResolvedCouponDto | undefined,
  ): Promise<ResolvedItem[]> {
    const metadata = await this.loadItemMetadata(command);
    const applicablePromotionIds = resolvedCoupon ? [resolvedCoupon.promotionId] : undefined;
    const standaloneProductQuantityByCategory = command.items.reduce<Record<string, number>>((acc, item) => {
      if (item.type !== 'PRODUCT') {
        return acc;
      }

      const categoryId = metadata.products.get(item.productTypeId)?.categoryId;
      if (categoryId) {
        acc[categoryId] = (acc[categoryId] ?? 0) + (item.quantity ?? 1);
      }

      return acc;
    }, {});

    const basePrices = await Promise.all(
      command.items.map((item) => {
        if (item.type === 'PRODUCT') {
          return this.pricingApi.calculateProductPriceV2({
            tenantId: command.tenantId,
            locationId: command.locationId,
            productTypeId: item.productTypeId,
            period,
            currency: command.currency,
            customerId: command.customerId,
            bookingCreatedAt,
            standaloneProductQuantityByCategory,
            applyPromotions: false,
          });
        }

        return this.pricingApi.calculateBundlePriceV2({
          tenantId: command.tenantId,
          locationId: command.locationId,
          bundleId: item.bundleId,
          period,
          currency: command.currency,
          customerId: command.customerId,
          bookingCreatedAt,
          standaloneProductQuantityByCategory,
          applyPromotions: false,
        });
      }),
    );

    const orderSubtotalBeforePromotions = basePrices
      .reduce((sum, price, index) => {
        const quantity = command.items[index].type === 'PRODUCT' ? (command.items[index].quantity ?? 1) : 1;
        return sum.add(price.finalPrice.toDecimal().mul(quantity));
      }, new Decimal(0))
      .toNumber();

    return Promise.all(
      command.items.map((item): Promise<ResolvedItem> => {
        if (item.type === 'PRODUCT') {
          return this.pricingApi
            .calculateProductPriceV2({
              tenantId: command.tenantId,
              locationId: command.locationId,
              productTypeId: item.productTypeId,
              period,
              currency: command.currency,
              customerId: command.customerId,
              bookingCreatedAt,
              applicablePromotionIds,
              standaloneProductQuantityByCategory,
              orderSubtotalBeforePromotions,
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
          this.pricingApi.calculateBundlePriceV2({
            tenantId: command.tenantId,
            locationId: command.locationId,
            bundleId: item.bundleId,
            period,
            currency: command.currency,
            customerId: command.customerId,
            bookingCreatedAt,
            applicablePromotionIds,
            standaloneProductQuantityByCategory,
            orderSubtotalBeforePromotions,
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
      Promise.all(
        productTypeIds.map((id) =>
          this.catalogApi.getProductTypeBookingEligibility(command.tenantId, command.locationId, id),
        ),
      ),
      Promise.all(
        bundleIds.map((id) => this.catalogApi.getBundleBookingEligibility(command.tenantId, command.locationId, id)),
      ),
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
      products: new Map<string, ProductTypeBookingEligibilityDto>(
        productTypeIds.map((id, index) => [id, productMetas[index]!]),
      ),
      bundles: new Map<string, BundleBookingEligibilityDto>(bundleIds.map((id, index) => [id, bundleMetas[index]!])),
    };
  }
}
