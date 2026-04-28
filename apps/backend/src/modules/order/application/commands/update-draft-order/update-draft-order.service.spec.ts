import { QueryBus } from '@nestjs/cqrs';
import { FulfillmentMethod, OrderStatus, ScheduleSlotType } from '@repo/types';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import { OrderDraftEditNotAllowedError } from 'src/modules/order/domain/errors/order.errors';
import { DraftOrderPricingService } from 'src/modules/order/domain/services/draft-order-pricing.service';
import { BookingSnapshot } from 'src/modules/order/domain/value-objects/booking-snapshot.value-object';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { PricingPublicApi } from 'src/modules/pricing/pricing.public-api';

import { UpdateDraftOrderCommand } from './update-draft-order.command';
import { UpdateDraftOrderService } from './update-draft-order.service';

describe('UpdateDraftOrderService', () => {
  const period = DateRange.create(new Date('2026-04-01T10:00:00.000Z'), new Date('2026-04-02T15:00:00.000Z'));

  function makePricingResult(amount: number) {
    return {
      basePrice: Money.of(amount, 'ARS'),
      finalPrice: Money.of(amount, 'ARS'),
      pricePerBillingUnit: Money.of(amount, 'ARS'),
      totalUnits: 1,
      appliedAdjustments: [],
    };
  }

  function makeOrder(status: OrderStatus) {
    return Order.create({
      tenantId: 'tenant-1',
      locationId: 'location-1',
      currency: 'ARS',
      customerId: 'customer-old',
      period,
      status,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      bookingSnapshot: BookingSnapshot.create({
        pickupDate: '2026-04-01',
        pickupTime: 600,
        returnDate: '2026-04-02',
        returnTime: 900,
        timezone: 'UTC',
      }),
      insuranceSelected: false,
      insuranceRatePercent: 0,
      notes: 'keep me',
    });
  }

  function makeService(existingOrder: Order) {
    let savedOrder: Order | null = null;
    let saveOptions: { replaceChildren?: boolean } | undefined;

    const prisma = {
      client: {
        $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({ tx: true })),
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
          return { id: 'location-2', supportsDelivery: true, effectiveTimezone: 'UTC' };
        }

        return [600, 900, 1020];
      }),
    } as unknown as QueryBus;

    const orderRepository = {
      load: jest.fn(async () => existingOrder),
      save: jest.fn(async (order: Order, _tx?: unknown, options?: { replaceChildren?: boolean }) => {
        savedOrder = order;
        saveOptions = options;
        return order.id;
      }),
    } as unknown as OrderRepository;

    const pricingApi = {
      priceBasket: jest.fn(async () => ({
        items: [
          {
            type: 'PRODUCT' as const,
            productTypeId: 'product-2',
            quantity: 1,
            locationId: 'location-2',
            period,
            currency: 'ARS',
            price: makePricingResult(150),
          },
        ],
        couponApplied: false,
        orderSubtotalBeforePromotions: 150,
        itemsSubtotal: 150,
        totalBeforeDiscounts: 150,
        totalDiscount: 0,
      })),
    } as unknown as PricingPublicApi;

    return {
      service: new UpdateDraftOrderService(
        prisma,
        queryBus,
        orderRepository,
        pricingApi,
        new DraftOrderPricingService(),
      ),
      saved: () => ({ savedOrder, saveOptions }),
    };
  }

  it('replaces editable draft fields and saves with replacement semantics', async () => {
    const existingOrder = makeOrder(OrderStatus.DRAFT);
    const { service, saved } = makeService(existingOrder);

    const result = await service.execute(
      new UpdateDraftOrderCommand({
        tenantId: 'tenant-1',
        orderId: existingOrder.id,
        locationId: 'location-2',
        customerId: 'customer-new',
        pickupDate: '2026-04-10',
        returnDate: '2026-04-12',
        pickupTime: 600,
        returnTime: 1020,
        items: [{ type: 'PRODUCT', productTypeId: 'product-2', quantity: 1 }],
        currency: 'ARS',
        insuranceSelected: false,
        fulfillmentMethod: FulfillmentMethod.DELIVERY,
        deliveryRequest: {
          recipientName: 'Jane Client',
          phone: '123',
          addressLine1: 'Main 1',
          city: 'Cordoba',
          stateRegion: 'Cordoba',
          postalCode: '5000',
          country: 'AR',
        },
        pricingAdjustment: {
          mode: 'TARGET_TOTAL',
          targetTotal: '120.00',
        },
        setByUserId: 'user-1',
      }),
    );

    expect(result.isOk()).toBe(true);
    expect(saved().saveOptions).toEqual({ replaceChildren: true });
    expect(saved().savedOrder?.id).toBe(existingOrder.id);
    expect(saved().savedOrder?.locationId).toBe('location-2');
    expect(saved().savedOrder?.customerId).toBe('customer-new');
    expect(saved().savedOrder?.currentBookingSnapshot?.pickupDate).toBe('2026-04-10');
    expect(saved().savedOrder?.currentBookingSnapshot?.returnTime).toBe(1020);
    expect(saved().savedOrder?.currentFulfillmentMethod).toBe(FulfillmentMethod.DELIVERY);
    expect(saved().savedOrder?.currentDeliveryRequest?.toJSON()).toMatchObject({
      recipientName: 'Jane Client',
      addressLine1: 'Main 1',
    });
    expect(saved().savedOrder?.currentNotes).toBe('keep me');
    expect(saved().savedOrder?.getItems()).toHaveLength(1);
    expect(saved().savedOrder?.currentFinancialSnapshot.total.toFixed(2)).toBe('120.00');
  });

  it('rejects replacing a non-draft order', async () => {
    const existingOrder = makeOrder(OrderStatus.CONFIRMED);
    const { service } = makeService(existingOrder);

    const result = await service.execute(
      new UpdateDraftOrderCommand({
        tenantId: 'tenant-1',
        orderId: existingOrder.id,
        locationId: 'location-2',
        pickupDate: '2026-04-10',
        returnDate: '2026-04-12',
        pickupTime: 600,
        returnTime: 1020,
        items: [{ type: 'PRODUCT', productTypeId: 'product-2', quantity: 1 }],
        currency: 'ARS',
        insuranceSelected: false,
        fulfillmentMethod: FulfillmentMethod.PICKUP,
        setByUserId: 'user-1',
      }),
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(OrderDraftEditNotAllowedError);
  });
});
