import { QueryBus } from '@nestjs/cqrs';
import { BookingMode, OrderAssignmentStage, OrderStatus, ScheduleSlotType } from '@repo/types';
import Decimal from 'decimal.js';
import { ok } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { Money } from 'src/core/domain/value-objects/money.value-object';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { PricingPublicApi } from 'src/modules/pricing/pricing.public-api';
import { CreateOrderCommand } from './create-order.command';
import { CreateOrderAssetResolver } from './create-order-asset-resolver';
import { CreateOrderItemResolver } from './create-order-item-resolver';
import { CreateOrderOwnerContractResolver } from './create-order-owner-contract-resolver';
import { CreateOrderService } from './create-order.service';

describe('CreateOrderService', () => {
  const period = DateRange.create(new Date('2026-03-30T10:00:00.000Z'), new Date('2026-03-31T15:00:00.000Z'));

  function makePricingResult() {
    return {
      basePrice: Money.of(100, 'ARS'),
      finalPrice: Money.of(100, 'ARS'),
      pricePerBillingUnit: Money.of(100, 'ARS'),
      totalUnits: 1,
      appliedDiscounts: [],
    };
  }

  function makeService(bookingMode: BookingMode) {
    let savedStatus: OrderStatus | null = null;
    let savedPeriod: DateRange | null = null;
    const savedAssignments: Array<{ stage: OrderAssignmentStage }> = [];

    const prisma = {
      client: {
        $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({})),
      },
    } as unknown as PrismaService;

    const queryBus = {
      execute: jest.fn(async (query: { constructor: { name: string }; type?: ScheduleSlotType }) => {
        if (query.constructor.name === 'GetTenantConfigQuery') {
          return { timezone: 'UTC', bookingMode };
        }

        return [600, 900];
      }),
    } as unknown as QueryBus;

    const orderRepository = {
      save: jest.fn(async (order) => {
        savedStatus = order.currentStatus;
        savedPeriod = order.currentPeriod;
        return order.id;
      }),
    } as unknown as OrderRepository;

    const pricingApi = {
      redeemCouponWithinTransaction: jest.fn(),
    } as unknown as PricingPublicApi;

    const inventoryApi = {
      saveOrderAssignment: jest.fn(async (assignment) => {
        savedAssignments.push({ stage: assignment.stage });
        return ok(undefined);
      }),
    } as unknown as InventoryPublicApi;

    const itemResolver = {
      resolve: jest.fn(async () => [
        {
          type: 'PRODUCT' as const,
          productTypeId: 'product-1',
          quantity: 1,
          locationId: 'location-1',
          period,
          currency: 'ARS',
          price: makePricingResult(),
        },
      ]),
    } as unknown as CreateOrderItemResolver;

    const assetResolver = {
      resolveDemand: jest.fn(async (demandUnits) => {
        demandUnits[0].resolvedAssetId = 'asset-1';
        return { unavailableItems: [], conflictGroups: [] };
      }),
    } as unknown as CreateOrderAssetResolver;

    const ownerContractResolver = {
      resolve: jest.fn(
        async () =>
          new Map<
            string,
            { ownerId: string; contractId: string; ownerShare: Decimal; rentalShare: Decimal; basis: never }
          >(),
      ),
    } as unknown as CreateOrderOwnerContractResolver;

    const service = new CreateOrderService(
      prisma,
      queryBus,
      orderRepository,
      pricingApi,
      inventoryApi,
      itemResolver,
      assetResolver,
      ownerContractResolver,
    );

    return { service, saved: () => ({ savedStatus, savedPeriod, savedAssignments }) };
  }

  function makeCommand() {
    return new CreateOrderCommand(
      'tenant-1',
      'location-1',
      'customer-1',
      { start: new Date('2026-03-30T00:00:00.000Z'), end: new Date('2026-03-31T00:00:00.000Z') },
      600,
      900,
      [{ type: 'PRODUCT', productTypeId: 'product-1', quantity: 1 }],
      'ARS',
    );
  }

  it('creates confirmed orders for instant-book tenants', async () => {
    const { service, saved } = makeService(BookingMode.INSTANT_BOOK);

    const result = await service.execute(makeCommand());

    expect(result.isOk()).toBe(true);
    expect(saved().savedStatus).toBe(OrderStatus.CONFIRMED);
    expect(saved().savedPeriod?.equals(period)).toBe(true);
    expect(saved().savedAssignments).toEqual([{ stage: OrderAssignmentStage.COMMITTED }]);
  });

  it('creates pending review orders for request-to-book tenants', async () => {
    const { service, saved } = makeService(BookingMode.REQUEST_TO_BOOK);

    const result = await service.execute(makeCommand());

    expect(result.isOk()).toBe(true);
    expect(saved().savedStatus).toBe(OrderStatus.PENDING_REVIEW);
    expect(saved().savedAssignments).toEqual([{ stage: OrderAssignmentStage.HOLD }]);
  });
});
