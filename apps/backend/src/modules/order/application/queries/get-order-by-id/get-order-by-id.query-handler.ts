import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderByIdQuery } from './get-order-by-id.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { OrderItemType, OrderStatus } from '@repo/types';
import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.value-object';
import Decimal from 'decimal.js';
import { OrderNotFoundException } from '../../../domain/exceptions/order.exceptions';
import { GetOrderByIdResponseDto } from './get-order-by-id.response.dto';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdQueryHandler implements IQueryHandler<GetOrderByIdQuery, GetOrderByIdResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrderByIdQuery): Promise<GetOrderByIdResponseDto> {
    const order = await this.prisma.client.order.findFirst({
      where: { id: query.orderId, tenantId: query.tenantId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isCompany: true,
            companyName: true,
          },
        },
        location: {
          select: { name: true },
        },
        items: {
          include: {
            productType: {
              select: { name: true },
            },
            bundle: {
              select: {
                name: true,
                components: {
                  select: {
                    quantity: true,
                    productType: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
            assetAssignments: {
              select: {
                asset: {
                  select: {
                    id: true,
                    serialNumber: true,
                    ownerId: true,
                    productTypeId: true,
                    owner: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
            ownerSplits: {
              select: {
                assetId: true,
                ownerAmount: true,
                rentalAmount: true,
                owner: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new OrderNotFoundException(query.orderId);
    }

    const period = DateRange.create(order.periodStart, order.periodEnd);

    // ── Items ─────────────────────────────────────────────────────────────────

    const items: GetOrderByIdResponseDto['items'] = order.items.map((item) => {
      const assets = item.assetAssignments.map((aa) => ({
        id: aa.asset.id,
        serialNumber: aa.asset.serialNumber,
        ownerId: aa.asset.ownerId,
        productTypeId: aa.asset.productTypeId,
        ownerName: aa.asset.owner?.name ?? null,
      }));

      if (item.type === OrderItemType.PRODUCT && item.productType) {
        return {
          id: item.id,
          type: OrderItemType.PRODUCT,
          name: item.productType.name,
          assets,
        };
      }

      if (item.type === OrderItemType.BUNDLE && item.bundle) {
        return {
          id: item.id,
          type: OrderItemType.BUNDLE,
          name: item.bundle.name,
          components: item.bundle.components.map((c) => ({
            productTypeId: c.productType.id,
            productTypeName: c.productType.name,
            quantity: c.quantity,
          })),
          assets,
        };
      }

      throw new Error(`Unexpected item type: ${item.type as string}`);
    });

    // ── Financial breakdown ───────────────────────────────────────────────────

    let totalOwnerObligations = new Decimal(0);

    const financialItems = order.items.map((item) => {
      const snapshot = PriceSnapshot.fromJSON(item.priceSnapshot);
      const label = item.type === OrderItemType.PRODUCT ? item.productType!.name : item.bundle!.name;

      let ownerSplitLine: GetOrderByIdResponseDto['financial']['items'][number]['ownerSplit'] = null;

      if (item.ownerSplits.length > 0) {
        // Build a map from assetId → productTypeId using the asset assignments
        const productTypeByAssetId = new Map(item.assetAssignments.map((aa) => [aa.asset.id, aa.asset.productTypeId]));

        // Build a map from productTypeId → component name using the bundle snapshot.
        // For product items this map is empty — componentName will always be null.
        const componentNameByProductTypeId = new Map(
          item.type === OrderItemType.BUNDLE
            ? item.bundle!.components.map((c) => [c.productType.id, c.productType.name])
            : [],
        );

        const totalOwnerAmount = item.ownerSplits.reduce(
          (sum, s) => sum.plus(s.ownerAmount.toString()),
          new Decimal(0),
        );
        const totalRentalAmount = item.ownerSplits.reduce(
          (sum, s) => sum.plus(s.rentalAmount.toString()),
          new Decimal(0),
        );
        const ownerNames = [...new Set(item.ownerSplits.map((s) => s.owner.name))].join(', ');

        // Resolve component name: follow assetId → productTypeId → component name.
        // For product items or when only one split exists with no bundle context,
        // componentName is null — the UI omits the component label.
        const componentNames = [
          ...new Set(
            item.ownerSplits
              .map((s) => {
                const productTypeId = productTypeByAssetId.get(s.assetId);
                return productTypeId ? (componentNameByProductTypeId.get(productTypeId) ?? null) : null;
              })
              .filter((n): n is string => n !== null),
          ),
        ].join(', ');

        totalOwnerObligations = totalOwnerObligations.plus(totalOwnerAmount);

        ownerSplitLine = {
          ownerName: ownerNames,
          componentName: componentNames || null, // null for product items
          ownerAmount: totalOwnerAmount.toString(),
          rentalAmount: totalRentalAmount.toString(),
        };
      }

      return {
        orderItemId: item.id,
        label,
        currency: snapshot.currency,
        basePrice: snapshot.basePrice.toString(),
        finalPrice: snapshot.finalPrice.toString(),
        discounts: snapshot.discounts.map((d) => ({
          ruleId: d.ruleId,
          ruleLabel: d.ruleLabel,
          type: d.type,
          value: d.value,
          discountAmount: d.discountAmount.toString(),
        })),
        ownerSplit: ownerSplitLine,
      };
    });

    const total = financialItems.reduce((sum, line) => sum.plus(line.finalPrice), new Decimal(0));

    const yourRevenue = total.minus(totalOwnerObligations);

    return {
      id: order.id,
      status: order.status as OrderStatus,
      number: order.orderNumber,
      createdAt: order.createdAt,
      notes: order.notes,
      customer: order.customer ?? null,
      location: { name: order.location.name },
      period,
      items,
      financial: {
        items: financialItems,
        total: total.toString(),
        yourRevenue: yourRevenue.toString(),
        ownerObligations: totalOwnerObligations.toString(),
      },
    };
  }
}
