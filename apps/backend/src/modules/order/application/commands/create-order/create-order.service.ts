import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import {
  AssignmentSource,
  AssignmentType,
  BookingMode,
  FulfillmentMethod,
  OrderItemType,
  OrderAssignmentStage,
  OrderStatus,
  ScheduleSlotType,
} from '@repo/types';
import Decimal from 'decimal.js';
import { err, ok, Result } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { GetLocationScheduleSlotsQuery } from 'src/modules/tenant/public/queries/get-location-schedule-slots.query';
import {
  GetLocationContextQuery,
  LocationContextReadModel,
} from 'src/modules/tenant/public/queries/get-location-context.query';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';
import { PricingPublicApi, ResolvedCouponDto } from 'src/modules/pricing/pricing.public-api';
import { OrderRepository } from 'src/modules/order/infrastructure/persistence/repositories/order.repository';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import { Order } from 'src/modules/order/domain/entities/order.entity';
import { OrderItem } from 'src/modules/order/domain/entities/order-item.entity';
import { BundleSnapshot, BundleSnapshotComponent } from 'src/modules/order/domain/entities/bundle-snapshot.entity';
import { OrderDeliveryRequest } from 'src/modules/order/domain/value-objects/order-delivery-request.value-object';
import { TenantConfig } from '@repo/schemas';

import { CreateOrderCommand } from './create-order.command';
import { CreateOrderAssetResolver, buildDemandUnits } from './create-order-asset-resolver';
import { CreateOrderError, ResolvedItem } from './create-order.types';
import { CreateOrderItemResolver } from './create-order-item-resolver';
import { CreateOrderOwnerContractResolver } from './create-order-owner-contract-resolver';
import { toPriceSnapshot } from './create-order-pricing-snapshot.mapper';
import {
  DeliveryNotSupportedForLocationError,
  InvalidPickupSlotError,
  InvalidBookingLocationError,
  InvalidReturnSlotError,
  BundleNotFoundError,
  OrderItemUnavailableError,
  OrderMustContainItemsError,
  ProductTypeNotFoundError,
} from '../../../domain/errors/order.errors';
import { TenantConfigNotFoundException } from '../../../domain/exceptions/order.exceptions';

@CommandHandler(CreateOrderCommand)
export class CreateOrderService implements ICommandHandler<CreateOrderCommand, Result<string, CreateOrderError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
    private readonly orderRepository: OrderRepository,
    private readonly pricingApi: PricingPublicApi,
    private readonly inventoryApi: InventoryPublicApi,
    private readonly itemResolver: CreateOrderItemResolver,
    private readonly assetResolver: CreateOrderAssetResolver,
    private readonly ownerContractResolver: CreateOrderOwnerContractResolver,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<string, CreateOrderError>> {
    if (command.items.length === 0) {
      return err(new OrderMustContainItemsError());
    }

    const locationValidation = await this.validateLocation(command);
    if (locationValidation.isErr()) {
      return err(locationValidation.error);
    }

    const slotValidation = await this.validateSlots(command);
    if (slotValidation.isErr()) {
      return err(slotValidation.error);
    }

    const now = new Date();
    const resolvedCoupon = await this.resolveCoupon(command, now);
    if (resolvedCoupon.isErr()) {
      return err(resolvedCoupon.error);
    }

    const { period, bookingMode } = await this.deriveBookingContext(command);

    let resolvedItems: ResolvedItem[];
    try {
      resolvedItems = await this.itemResolver.resolve(command, period, resolvedCoupon.value);
    } catch (error) {
      if (
        error instanceof ProductTypeNotFoundError ||
        error instanceof BundleNotFoundError ||
        error instanceof ProductTypeInactiveForBookingError ||
        error instanceof BundleInactiveForBookingError ||
        error instanceof ProductTypeNotBookableAtLocationError ||
        error instanceof BundleNotBookableAtLocationError
      ) {
        return err(error as CreateOrderError);
      }

      throw error;
    }

    return this.prisma.client.$transaction(async (tx) => {
      const order = Order.create({
        tenantId: command.tenantId,
        locationId: command.locationId,
        currency: command.currency,
        customerId: command.customerId,
        period,
        status: bookingMode === BookingMode.REQUEST_TO_BOOK ? OrderStatus.PENDING_REVIEW : OrderStatus.CONFIRMED,
        fulfillmentMethod: command.fulfillmentMethod,
        deliveryRequest:
          command.fulfillmentMethod === FulfillmentMethod.DELIVERY && command.deliveryRequest
            ? OrderDeliveryRequest.create(command.deliveryRequest)
            : null,
        insuranceSelected: command.insuranceSelected,
      });

      const demandUnits = buildDemandUnits(resolvedItems);
      const availability = await this.assetResolver.resolveDemand(demandUnits);
      if (availability.unavailableItems.length > 0 || availability.conflictGroups.length > 0) {
        return err(new OrderItemUnavailableError(availability.unavailableItems, availability.conflictGroups));
      }

      const contractByAssetId = await this.ownerContractResolver.resolve(command.tenantId, period.start, demandUnits);
      const assignmentStage =
        bookingMode === BookingMode.REQUEST_TO_BOOK ? OrderAssignmentStage.HOLD : OrderAssignmentStage.COMMITTED;
      const pendingAssignments = this.attachResolvedItemsToOrder(
        order,
        resolvedItems,
        demandUnits,
        contractByAssetId,
        assignmentStage,
      );

      await this.orderRepository.save(order, tx);

      if (resolvedCoupon.value) {
        const redeemCouponResult = await this.pricingApi.redeemCouponWithinTransaction(
          {
            couponId: resolvedCoupon.value.couponId,
            orderId: order.id,
            customerId: command.customerId,
            now,
          },
          tx,
        );

        if (redeemCouponResult.isErr()) {
          return err(redeemCouponResult.error);
        }
      }

      const assignmentResults = await Promise.all(
        pendingAssignments.map((assignment) => this.inventoryApi.saveOrderAssignment(assignment, tx)),
      );

      if (assignmentResults.some((result) => result.isErr())) {
        return err(
          new OrderItemUnavailableError(
            resolvedItems.map((item) =>
              item.type === 'PRODUCT'
                ? { type: 'PRODUCT', productTypeId: item.productTypeId }
                : { type: 'BUNDLE', bundleId: item.bundleId },
            ),
          ),
        );
      }

      return ok(order.id);
    });
  }

  private async validateLocation(
    command: CreateOrderCommand,
  ): Promise<Result<void, InvalidBookingLocationError | DeliveryNotSupportedForLocationError>> {
    const location = await this.queryBus.execute<GetLocationContextQuery, LocationContextReadModel | null>(
      new GetLocationContextQuery(command.tenantId, command.locationId),
    );

    if (!location) {
      return err(new InvalidBookingLocationError(command.locationId));
    }

    if (command.fulfillmentMethod === FulfillmentMethod.DELIVERY && !location.supportsDelivery) {
      return err(new DeliveryNotSupportedForLocationError(command.locationId));
    }

    return ok(undefined);
  }

  private async validateSlots(
    command: CreateOrderCommand,
  ): Promise<Result<void, InvalidPickupSlotError | InvalidReturnSlotError>> {
    const [pickupSlots, returnSlots] = await Promise.all([
      this.queryBus.execute<GetLocationScheduleSlotsQuery, number[]>(
        new GetLocationScheduleSlotsQuery(
          command.tenantId,
          command.locationId,
          command.pickupDate,
          ScheduleSlotType.PICKUP,
        ),
      ),
      this.queryBus.execute<GetLocationScheduleSlotsQuery, number[]>(
        new GetLocationScheduleSlotsQuery(
          command.tenantId,
          command.locationId,
          command.returnDate,
          ScheduleSlotType.RETURN,
        ),
      ),
    ]);

    if (!pickupSlots.includes(command.pickupTime)) {
      return err(new InvalidPickupSlotError(command.pickupTime));
    }

    if (!returnSlots.includes(command.returnTime)) {
      return err(new InvalidReturnSlotError(command.returnTime));
    }

    return ok(undefined);
  }

  private async resolveCoupon(
    command: CreateOrderCommand,
    now: Date,
  ): Promise<Result<ResolvedCouponDto | undefined, CreateOrderError>> {
    if (!command.couponCode) {
      return ok(undefined);
    }

    const resolvedCoupon = await this.pricingApi.resolveCouponForPricing({
      tenantId: command.tenantId,
      code: command.couponCode,
      customerId: command.customerId,
      now,
    });

    if (resolvedCoupon.isErr()) {
      return err(resolvedCoupon.error);
    }

    return ok(resolvedCoupon.value);
  }

  private async deriveBookingContext(
    command: CreateOrderCommand,
  ): Promise<{ period: DateRange; bookingMode: BookingMode }> {
    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(command.tenantId),
    );

    if (!tenantConfig) {
      throw new TenantConfigNotFoundException(command.tenantId);
    }

    return {
      period: DateRange.fromLocalDateKeySlots(
        command.pickupDate,
        command.pickupTime,
        command.returnDate,
        command.returnTime,
        tenantConfig.timezone,
      ),
      bookingMode: tenantConfig.bookingMode,
    };
  }

  private attachResolvedItemsToOrder(
    order: Order,
    resolvedItems: ResolvedItem[],
    demandUnits: ReturnType<typeof buildDemandUnits>,
    contractByAssetId: Awaited<ReturnType<CreateOrderOwnerContractResolver['resolve']>>,
    assignmentStage: OrderAssignmentStage,
  ): Array<Parameters<InventoryPublicApi['saveOrderAssignment']>[0]> {
    let unitCursor = 0;
    const pendingAssignments: Array<Parameters<InventoryPublicApi['saveOrderAssignment']>[0]> = [];

    for (const item of resolvedItems) {
      if (item.type === 'PRODUCT') {
        const units = demandUnits.slice(unitCursor, unitCursor + item.quantity);
        unitCursor += item.quantity;

        for (const unit of units) {
          const orderItem = OrderItem.create({
            orderId: order.id,
            type: OrderItemType.PRODUCT,
            priceSnapshot: toPriceSnapshot(item.price, item.currency),
            productTypeId: item.productTypeId,
          });

          const contract = contractByAssetId.get(unit.resolvedAssetId!);
          if (contract) {
            orderItem.assignOwnerSplit({
              assetId: unit.resolvedAssetId!,
              ownerId: contract.ownerId,
              contractId: contract.contractId,
              ownerShare: new Decimal(contract.ownerShare),
              rentalShare: new Decimal(contract.rentalShare),
              basis: contract.basis,
              productTypeId: item.productTypeId,
            });
          }

          order.addItem(orderItem);
          pendingAssignments.push({
            assetId: unit.resolvedAssetId!,
            period: item.period,
            type: AssignmentType.ORDER,
            stage: assignmentStage,
            source: contract ? AssignmentSource.EXTERNAL : AssignmentSource.OWNED,
            orderId: order.id,
            orderItemId: orderItem.id,
          });
        }

        continue;
      }

      const totalComponentUnits = item.bundle.components.reduce((sum, component) => sum + component.quantity, 0);
      const units = demandUnits.slice(unitCursor, unitCursor + totalComponentUnits);
      unitCursor += totalComponentUnits;

      const snapshotComponents = item.bundle.components.map((component) =>
        BundleSnapshotComponent.create({
          productTypeId: component.productTypeId,
          productTypeName: component.productTypeName,
          quantity: component.quantity,
          pricePerUnit: item.componentStandalonePrices.get(component.productTypeId) ?? new Decimal(0),
        }),
      );

      const orderItem = OrderItem.create({
        orderId: order.id,
        type: OrderItemType.BUNDLE,
        priceSnapshot: toPriceSnapshot(item.price, item.currency),
        bundleId: item.bundleId,
      });

      const snapshot = BundleSnapshot.create({
        orderItemId: orderItem.id,
        bundleId: item.bundle.id,
        bundleName: item.bundle.name,
        bundlePrice: item.price.finalPrice.toDecimal(),
        components: snapshotComponents,
      });

      const orderItemWithSnapshot = OrderItem.reconstitute({
        id: orderItem.id,
        orderId: orderItem.orderId,
        type: orderItem.type,
        priceSnapshot: orderItem.priceSnapshot,
        productTypeId: orderItem.productTypeId,
        bundleId: orderItem.bundleId,
        bundleSnapshot: snapshot,
        ownerSplits: [],
      });

      for (const unit of units) {
        const contract = contractByAssetId.get(unit.resolvedAssetId!);
        if (contract) {
          orderItemWithSnapshot.assignOwnerSplit({
            assetId: unit.resolvedAssetId!,
            ownerId: contract.ownerId,
            contractId: contract.contractId,
            ownerShare: new Decimal(contract.ownerShare),
            rentalShare: new Decimal(contract.rentalShare),
            basis: contract.basis,
            productTypeId: unit.productTypeId,
          });
        }
      }

      order.addItem(orderItemWithSnapshot);

      for (const unit of units) {
        pendingAssignments.push({
          assetId: unit.resolvedAssetId!,
          period: item.period,
          type: AssignmentType.ORDER,
          stage: assignmentStage,
          source: contractByAssetId.has(unit.resolvedAssetId!) ? AssignmentSource.EXTERNAL : AssignmentSource.OWNED,
          orderId: order.id,
          orderItemId: orderItemWithSnapshot.id,
        });
      }
    }

    return pendingAssignments;
  }
}
