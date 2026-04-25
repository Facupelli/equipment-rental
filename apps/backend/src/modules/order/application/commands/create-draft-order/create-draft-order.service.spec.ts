import { QueryBus } from '@nestjs/cqrs';
import { FulfillmentMethod, OrderStatus, ScheduleSlotType } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import { DraftOrderPricingService } from 'src/modules/order/domain/services/draft-order-pricing.service';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { PricingPublicApi } from 'src/modules/pricing/pricing.public-api';

import { CreateDraftOrderCommand } from './create-draft-order.command';
import { CreateDraftOrderService } from './create-draft-order.service';

describe('CreateDraftOrderService', () => {
  const period = DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T15:00:00.000Z'));

  function makePricingResult() {
    return {
      basePrice: Money.of(100, 'ARS'),
      finalPrice: Money.of(100, 'ARS'),
      pricePerBillingUnit: Money.of(100, 'ARS'),
      totalUnits: 1,
      appliedAdjustments: [],
    };
  }

  function makeService() {
    let savedStatus: OrderStatus | null = null;
    let savedCustomerId: string | null = null;
    let savedItemCount = 0;
    let savedOrder: Order | null = null;

    const prisma = {
      client: {
        $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({})),
      },
    } as unknown as PrismaService;

    const queryBus = {
      execute: jest.fn(async (query: { constructor: { name: string }; type?: ScheduleSlotType }) => {
        if (query.constructor.name === 'GetTenantConfigQuery') {
          return {
            timezone: 'UTC',
            pricing: {
              insuranceEnabled: false,
              insuranceRatePercent: 6,
            },
          };
        }

        if (query.constructor.name === 'GetLocationContextQuery') {
          return { id: 'location-1', supportsDelivery: false, effectiveTimezone: 'UTC' };
        }

        return [600, 900];
      }),
    } as unknown as QueryBus;

    const orderRepository = {
      save: jest.fn(async (order) => {
        savedOrder = order;
        savedStatus = order.currentStatus;
        savedCustomerId = order.customerId;
        savedItemCount = order.getItems().length;
        return order.id;
      }),
    } as unknown as OrderRepository;

    const pricingApi = {
      priceBasket: jest.fn(async () => ({
        items: [
          {
            type: 'PRODUCT' as const,
            productTypeId: 'product-1',
            quantity: 1,
            locationId: 'location-1',
            period,
            currency: 'ARS',
            price: makePricingResult(),
          },
        ],
        couponApplied: false,
        orderSubtotalBeforePromotions: 100,
        itemsSubtotal: 100,
        totalBeforeDiscounts: 100,
        totalDiscount: 0,
      })),
    } as unknown as PricingPublicApi;

    const service = new CreateDraftOrderService(
      prisma,
      queryBus,
      orderRepository,
      pricingApi,
      new DraftOrderPricingService(),
    );

    return {
      service,
      saved: () => ({ savedStatus, savedCustomerId, savedItemCount, savedOrder }),
    };
  }

  it('creates a draft order without requiring a customer', async () => {
    const { service, saved } = makeService();

    const result = await service.execute(
      new CreateDraftOrderCommand({
        tenantId: 'tenant-1',
        locationId: 'location-1',
        pickupDate: '2026-03-30',
        returnDate: '2026-03-31',
        pickupTime: 600,
        returnTime: 900,
        items: [{ type: 'PRODUCT', productTypeId: 'product-1', quantity: 1 }],
        currency: 'ARS',
        insuranceSelected: false,
        setByUserId: 'user-1',
        fulfillmentMethod: FulfillmentMethod.PICKUP,
      }),
    );

    expect(result.isOk()).toBe(true);
    expect(saved()).toEqual({
      savedStatus: OrderStatus.DRAFT,
      savedCustomerId: null,
      savedItemCount: 1,
      savedOrder: expect.any(Order),
    });
  });

  it('creates a draft order with an initial target total override', async () => {
    const { service, saved } = makeService();

    const result = await service.execute(
      new CreateDraftOrderCommand({
        tenantId: 'tenant-1',
        locationId: 'location-1',
        pickupDate: '2026-03-30',
        returnDate: '2026-03-31',
        pickupTime: 600,
        returnTime: 900,
        items: [{ type: 'PRODUCT', productTypeId: 'product-1', quantity: 1 }],
        currency: 'ARS',
        insuranceSelected: false,
        setByUserId: 'user-1',
        initialPricingAdjustment: {
          mode: 'TARGET_TOTAL',
          targetTotal: '80.00',
        },
        fulfillmentMethod: FulfillmentMethod.PICKUP,
      }),
    );

    expect(result.isOk()).toBe(true);
    expect(saved().savedOrder?.currentFinancialSnapshot.total.toFixed(2)).toBe('80.00');
    expect(saved().savedOrder?.getItems()[0].calculatedPriceSnapshot.finalPrice.toFixed(2)).toBe('100.00');
    expect(saved().savedOrder?.getItems()[0].manualPricingOverride?.finalPrice.toFixed(2)).toBe('80.00');
    expect(saved().savedOrder?.getItems()[0].manualPricingOverride?.setByUserId).toBe('user-1');
  });

  it('rejects an invalid initial target total', async () => {
    const { service, saved } = makeService();

    const result = await service.execute(
      new CreateDraftOrderCommand({
        tenantId: 'tenant-1',
        locationId: 'location-1',
        pickupDate: '2026-03-30',
        returnDate: '2026-03-31',
        pickupTime: 600,
        returnTime: 900,
        items: [{ type: 'PRODUCT', productTypeId: 'product-1', quantity: 1 }],
        currency: 'ARS',
        insuranceSelected: false,
        setByUserId: 'user-1',
        initialPricingAdjustment: {
          mode: 'TARGET_TOTAL',
          targetTotal: '0.00',
        },
        fulfillmentMethod: FulfillmentMethod.PICKUP,
      }),
    );

    expect(result.isErr()).toBe(true);
    expect(saved().savedOrder).toBeNull();
  });
});
