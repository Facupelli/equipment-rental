import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { GetOrderByIdQuery } from './get-order-by-id.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { FulfillmentMethod, OrderItemType, OrderStatus } from '@repo/types';
import { OrderFinancialSnapshot } from 'src/modules/order/domain/value-objects/order-financial-snapshot.value-object';
import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.value-object';
import Decimal from 'decimal.js';
import { OrderNotFoundException } from '../../../domain/exceptions/order.exceptions';
import { GetOrderByIdResponseDto } from './get-order-by-id.response.dto';
import { TenantConfig } from '@repo/schemas';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdQueryHandler implements IQueryHandler<GetOrderByIdQuery, GetOrderByIdResponseDto> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetOrderByIdQuery): Promise<GetOrderByIdResponseDto> {
    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(query.tenantId),
    );

    if (!tenantConfig) {
      throw new Error(`Tenant config not found for tenant "${query.tenantId}"`);
    }

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
        deliveryRequest: {
          select: {
            recipientName: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            stateRegion: true,
            postalCode: true,
            country: true,
            instructions: true,
          },
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
    const financialSnapshot = OrderFinancialSnapshot.fromJSON(order.financialSnapshot);

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
          sourceKind: d.sourceKind,
          sourceId: d.sourceId,
          label: d.label,
          promotionId: d.sourceId,
          promotionLabel: d.label,
          type: d.type,
          value: d.value,
          discountAmount: d.discountAmount.toString(),
        })),
        ownerSplit: ownerSplitLine,
      };
    });

    const yourRevenue = financialSnapshot.itemsSubtotal.minus(totalOwnerObligations);

    return {
      id: order.id,
      status: order.status as OrderStatus,
      fulfillmentMethod: order.fulfillmentMethod as FulfillmentMethod,
      number: order.orderNumber,
      createdAt: order.createdAt,
      pickupDate: toLocalDateKey(order.periodStart, tenantConfig.timezone),
      returnDate: toLocalDateKey(order.periodEnd, tenantConfig.timezone),
      pickupAt: order.periodStart,
      returnAt: order.periodEnd,
      notes: order.notes,
      customer: order.customer ?? null,
      location: { name: order.location.name },
      deliveryRequest: order.deliveryRequest
        ? {
            recipientName: order.deliveryRequest.recipientName,
            phone: order.deliveryRequest.phone,
            addressLine1: order.deliveryRequest.addressLine1,
            addressLine2: order.deliveryRequest.addressLine2,
            city: order.deliveryRequest.city,
            stateRegion: order.deliveryRequest.stateRegion,
            postalCode: order.deliveryRequest.postalCode,
            country: order.deliveryRequest.country,
            instructions: order.deliveryRequest.instructions,
          }
        : null,
      period,
      items,
      financial: {
        items: financialItems,
        itemsSubtotal: financialSnapshot.itemsSubtotal.toString(),
        subtotalBeforeDiscounts: financialSnapshot.subtotalBeforeDiscounts.toString(),
        itemsDiscountTotal: financialSnapshot.itemsDiscountTotal.toString(),
        insuranceApplied: financialSnapshot.insuranceApplied,
        insuranceAmount: financialSnapshot.insuranceAmount.toString(),
        total: financialSnapshot.total.toString(),
        yourRevenue: yourRevenue.toString(),
        ownerObligations: totalOwnerObligations.toString(),
      },
    };
  }
}

function toLocalDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';

  return `${get('year')}-${get('month')}-${get('day')}`;
}
