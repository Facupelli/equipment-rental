import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetOrderByIdQuery } from './get-order-by-id.query';
import { PrismaService } from 'src/core/database/prisma.service';
import { OrderDetailResponseDto } from '@repo/schemas';
import { parsePostgresRange } from 'src/core/utils/postgres-range.util';
import { OrderItemType, OrderStatus } from '@repo/types';
import { PriceSnapshot } from 'src/modules/order/domain/value-objects/price-snapshot.vo';
import Decimal from 'decimal.js';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdQueryHandler implements IQueryHandler<GetOrderByIdQuery, OrderDetailResponseDto> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrderByIdQuery): Promise<OrderDetailResponseDto> {
    const [order, assignmentRows] = await Promise.all([
      this.prisma.client.order.findUnique({
        where: { id: query.orderId },
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
                    select: { id: true, serialNumber: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.client.$queryRaw<{ period: string }[]>`
        SELECT period::text
        FROM asset_assignments
        WHERE order_id = ${query.orderId}
        LIMIT 1
      `,
    ]);

    if (!order) {
      console.log('UQERY BY ID');
      throw new NotFoundException(`Order ${query.orderId} not found`);
    }

    if (assignmentRows.length === 0) {
      throw new NotFoundException(`Order ${query.orderId} has no assignments`);
    }

    const period = parsePostgresRange(assignmentRows[0].period);

    const items: OrderDetailResponseDto['items'] = order.items.map((item) => {
      const assets = item.assetAssignments.map((aa) => ({
        id: aa.asset.id,
        serialNumber: aa.asset.serialNumber,
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

    const financialItems = order.items.map((item) => {
      const snapshot = PriceSnapshot.fromJSON(item.priceSnapshot);
      const label = item.type === OrderItemType.PRODUCT ? item.productType!.name : item.bundle!.name;

      return {
        orderItemId: item.id,
        label,
        currency: snapshot.currency,
        basePrice: snapshot.basePrice.toString(),
        finalPrice: snapshot.finalPrice.toString(),
        discounts: snapshot.discounts.map((d) => ({
          ruleId: d.ruleId,
          type: d.type,
          value: d.value,
          discountAmount: d.discountAmount.toString(),
        })),
      };
    });

    const total = financialItems.reduce((sum, line) => sum.add(line.finalPrice), new Decimal(0)).toString();

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
      financial: { items: financialItems, total },
    };
  }
}
