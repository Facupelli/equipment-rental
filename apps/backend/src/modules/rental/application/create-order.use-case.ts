import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { TenantConfigPort } from 'src/modules/tenancy/domain/ports/tenant-config.port';
import { AvailabilityService } from './availability.service';
import { TrackingType } from '@repo/types';
import { PricingEngine } from './pricing-engine/pricing-engine';
import { LogContext } from 'src/core/logger/log-context';
import { CustomerQueryPort } from 'src/modules/customer/application/ports/customer-query.port';
import { RentalProductQueryPort, RentalProductView } from './ports/rental-product.port';
import { OrderRepositoryPort } from './ports/order.repository.port';
import { BundleQueryPort, BundleView } from 'src/modules/inventory/application/ports/bundle-query.port';
import { BookingCandidate } from './ports/availability-repository.port';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { BookingItem } from '../domain/entities/booking.entity';
import { OrderBundle } from '../domain/entities/order-bundle.entity';
import { Order } from '../domain/entities/order.entity';
import { PriceBreakdown } from '../domain/value-objects/price-breakdown.vo';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly customerQuery: CustomerQueryPort,
    private readonly tenancyQuery: TenantConfigPort,
    private readonly availabilityService: AvailabilityService,
    private readonly pricingEngine: PricingEngine,
    private readonly rentalProductQuery: RentalProductQueryPort,
    private readonly bundleQuery: BundleQueryPort,
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(dto: CreateOrderDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const { customerId, items, startDate, endDate } = dto;
    // const period = DateRange.create(startDate, endDate);

    // ── Enrich canonical log with the intent of this command ──────────────
    LogContext.set('tenantId', tenantId);
    LogContext.set('customerId', customerId);
    LogContext.set('lineItemCount', items.length);
    LogContext.set('rentalStart', startDate);
    LogContext.set('rentalEnd', endDate);
    // ─────────────────────────────────────────────────────────────────────

    const [customer, tenantConfig] = await Promise.all([
      this.customerQuery.getCustomer(customerId),
      this.tenancyQuery.findPricingInputs(tenantId),
    ]);

    this.validateCustomer(customer, customerId);
    if (!tenantConfig) {
      throw new NotFoundException(`Tenant '${tenantId}' configuration not found.`);
    }

    // ------------------------------------------------------------------
    // Step 3 — Load products/bundles and expand into BookingCandidates
    // ------------------------------------------------------------------
    const productMap = new Map<string, RentalProductView>();
    const bundleMap = new Map<string, BundleView>();
    const candidates: BookingCandidate[] = [];

    for (const item of dto.items) {
      if (item.type === 'PRODUCT') {
        const product = await this.rentalProductQuery.findRentalProductById(item.productId);

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.pricingTiers.length === 0) {
          throw new UnprocessableEntityException(`Product ${item.productId} has no pricing tiers configured`);
        }

        productMap.set(product.id, product);

        if (product.trackingType === TrackingType.SERIALIZED) {
          candidates.push({
            trackingType: TrackingType.SERIALIZED,
            productId: product.id,
            inventoryItemId: null,
          });
        } else {
          // BULK
          if (!item.quantity || item.quantity < 1) {
            throw new BadRequestException(`quantity is required and must be >= 1 for BULK product ${item.productId}`);
          }

          if (product.totalStock === null || product.totalStock === undefined) {
            throw new UnprocessableEntityException(`BULK product ${item.productId} has no totalStock configured`);
          }

          candidates.push({
            trackingType: TrackingType.BULK,
            productId: product.id,
            quantity: item.quantity,
            totalStock: product.totalStock,
          });
        }
      } else {
        // BUNDLE
        const bundle = await this.bundleQuery.findBundleWithComponents(item.bundleId, tenantId);

        if (!bundle) {
          throw new NotFoundException(`Bundle ${item.bundleId} not found`);
        }

        if (bundle.pricingTiers.length === 0) {
          throw new UnprocessableEntityException(`Bundle ${item.bundleId} has no pricing tiers configured`);
        }

        bundleMap.set(bundle.id, bundle);

        // Expand each component by its quantity into individual candidates.
        // quantity: 2 on a component → 2 separate BookingCandidate rows.
        for (const component of bundle.components) {
          productMap.set(component.productId, component.product);

          for (let i = 0; i < component.quantity; i++) {
            if (component.product.trackingType === TrackingType.SERIALIZED) {
              candidates.push({
                trackingType: TrackingType.SERIALIZED,
                productId: component.productId,
                inventoryItemId: null,
                bundleId: bundle.id,
              });
            } else {
              // BULK component — quantity of 1 per expansion step
              if (component.product.totalStock === null || component.product.totalStock === undefined) {
                throw new UnprocessableEntityException(
                  `BULK component product ${component.productId} has no totalStock configured`,
                );
              }

              candidates.push({
                trackingType: TrackingType.BULK,
                productId: component.productId,
                quantity: 1,
                totalStock: component.product.totalStock,
                bundleId: bundle.id,
              });
            }
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Step 4 — Availability check and unit auto-assignment
    // Throws AvailabilityException if any candidate is unavailable.
    // ------------------------------------------------------------------
    const bookingRange = DateRange.create(startDate, endDate);
    const resolved = await this.availabilityService.checkAndResolve(candidates, bookingRange, tenantId);

    // ------------------------------------------------------------------
    // Step 5 — Build domain entities
    //
    // For each resolved candidate: price it and construct a BookingItem.
    // For each bundle: price it and construct an OrderBundle.
    // Financial totals are computed by Order.create() from these children —
    // the Use Case never does money arithmetic directly.
    // ------------------------------------------------------------------
    const currency = tenantConfig.pricingConfig.defaultCurrency;

    const bookingItems: BookingItem[] = resolved.map((candidate) => {
      const product = productMap.get(candidate.productId)!;

      const breakdown = this.pricingEngine.calculate({
        startDate: dto.startDate,
        endDate: dto.endDate,
        inventoryItemId: candidate.trackingType === 'SERIALIZED' ? candidate.inventoryItemId : null,
        tiers: product.pricingTiers,
        units: tenantConfig.billingUnits,
        config: tenantConfig.pricingConfig,
      });

      return BookingItem.create({
        tenantId,
        trackingType: candidate.trackingType as TrackingType,
        productId: candidate.productId,
        bundleId: candidate.trackingType === 'SERIALIZED' ? (candidate.bundleId ?? null) : (candidate.bundleId ?? null),
        inventoryItemId: candidate.trackingType === 'SERIALIZED' ? candidate.inventoryItemId : null,
        quantity: candidate.trackingType === 'BULK' ? candidate.quantity : null,
        unitPrice: breakdown.total,
        priceBreakdown: PriceBreakdown.fromJson(breakdown),
        orderId: '',
      });
    });

    const orderBundles: OrderBundle[] = [];

    for (const [bundleId, bundle] of bundleMap) {
      const breakdown = this.pricingEngine.calculateForBundle({
        startDate: dto.startDate,
        endDate: dto.endDate,
        tiers: bundle.pricingTiers,
        units: tenantConfig.billingUnits,
        config: tenantConfig.pricingConfig,
      });

      orderBundles.push(
        OrderBundle.create({
          tenantId,
          bundleId,
          bundlePrice: breakdown.total,
          priceBreakdown: PriceBreakdown.fromJson(breakdown),
        }),
      );
    }

    // ------------------------------------------------------------------
    // Step 6 — Construct Order aggregate and persist
    //
    // Order.create() owns the grandTotal calculation — the Use Case does
    // not touch money arithmetic. The repository receives the fully
    // constructed aggregate and handles persistence mechanics.
    // ------------------------------------------------------------------
    const order = Order.create({
      tenantId,
      customerId: dto.customerId,
      bookingRange,
      bookings: bookingItems,
      orderBundles,
      currency,
      notes: dto.notes,
    });

    await this.orderRepository.save(order);

    LogContext.set('orderId', order.id);

    // return order.id;
    return order.id;
  }

  private validateCustomer(customer: any, id: string) {
    if (!customer) throw new BadRequestException(`Customer "${id}" not found.`);
    if (!customer.canBook) throw new BadRequestException(`Customer "${id}" is blacklisted.`);
  }
}
