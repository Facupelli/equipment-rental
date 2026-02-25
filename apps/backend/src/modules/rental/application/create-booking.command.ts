import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RentalCustomerQueryPort } from '../domain/ports/rental-customer.port';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { RentalTenancyPricingView, TenantConfigPort } from 'src/modules/tenancy/domain/ports/tenant-config.port';
import { RentalProductQueryPort, RentalProductView } from '../domain/ports/rental-product.port';
import { AvailabilityService, AvailabilityStatus } from './availability.service';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { TrackingType } from '@repo/types';
import { PriceBreakdown } from '../domain/value-objects/price-breakdown.vo';
import { PricingEngine } from './pricing-engine/pricing-engine';
import { Money } from '../domain/value-objects/money.vo';
import { Booking } from '../domain/entities/booking.entity';
import { BookingLineItem } from '../domain/entities/booking-line-item.entity';
import { BookingRepository } from '../domain/ports/booking.repository';
import { CandidateItem } from '../domain/ports/rental-inventory-read.port';
import { AppLogger } from 'src/core/logger/app-logger.service';
import { LogContext } from 'src/core/logger/log-context';

/**
 * Represents a fully resolved line after all pre-transaction I/O:
 * availability is checked, pricing is calculated, candidates are ranked.
 * The transaction phase only constructs entities and persists — no more I/O.
 */
interface ResolvedLine {
  productId: string;
  trackingType: TrackingType;
  requestedQuantity: number;

  /**
   * SERIALIZED + AVAILABLE: ranked candidate item IDs (preferred hint first).
   * BULK or over-rental: empty — physical item assignment is not applicable.
   */
  candidateItems: CandidateItem[];

  /**
   * True when AvailabilityService returned OVERBOOK_WARNING.
   * This line will be booked without a physical item assigned (inventoryItemId = null).
   */
  isOverRental: boolean;

  priceBreakdown: PriceBreakdown;

  /**
   * Snapshot fields pre-extracted from PriceBreakdown so the transaction
   * phase is pure entity construction with no further derivation.
   */
  unitPrice: Money;
  currency: string;
}

@Injectable()
export class CreateBookingCommand {
  constructor(
    private readonly logger: AppLogger,
    private readonly tenantContext: TenantContextService,
    private readonly customerQuery: RentalCustomerQueryPort,
    private readonly tenancyQuery: TenantConfigPort,
    private readonly productQuery: RentalProductQueryPort,
    private readonly availabilityService: AvailabilityService,
    private readonly pricingEngine: PricingEngine,
    private readonly bookingRepo: BookingRepository,
  ) {}

  async execute(command: CreateBookingDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const { customerId, lineItems, startDate, endDate, notes } = command;
    const period = DateRange.create(startDate, endDate);

    // ── Enrich canonical log with the intent of this command ──────────────
    LogContext.set('tenantId', tenantId);
    LogContext.set('customerId', customerId);
    LogContext.set('lineItemCount', lineItems.length);
    LogContext.set('rentalStart', startDate);
    LogContext.set('rentalEnd', endDate);
    // ─────────────────────────────────────────────────────────────────────

    const [customer, tenancyPricingInputs] = await Promise.all([
      this.customerQuery.findById(customerId),
      this.tenancyQuery.findPricingInputs(tenantId),
    ]);

    this.validateCustomer(customer, customerId);
    if (!tenancyPricingInputs) {
      throw new NotFoundException(`Tenant '${tenantId}' configuration not found.`);
    }

    // 3. Resolve Lines (Pricing + Availability)
    // Passes tenancyInputs for early currency validation
    const resolvedLines = await Promise.all(
      lineItems.map((lineItem) =>
        this.resolveLine(
          tenantId,
          lineItem.productId,
          lineItem.quantity,
          lineItem.preferredInventoryItemId ?? null,
          period,
          tenancyPricingInputs,
        ),
      ),
    );

    const overRentalCount = resolvedLines.filter((l) => l.isOverRental).length;
    LogContext.set('overRentalLines', overRentalCount);

    // 4. Construct Domain Objects
    // Booking.create handles ID generation, status derivation, and total calculation.
    const bookingLineItems = resolvedLines.map((line) => this.buildLineItem(line));

    const booking = Booking.create({
      tenantId,
      customerId,
      rentalPeriod: period,
      lineItems: bookingLineItems,
      // Currency is consistent due to validation in resolveLine
      currency: resolvedLines[0].currency,
      notes,
    });

    await this.bookingRepo.save(booking);

    LogContext.set('bookingId', booking.id);

    return booking.id;
  }

  private validateCustomer(customer: any, id: string) {
    if (!customer) throw new BadRequestException(`Customer "${id}" not found.`);
    if (!customer.canBook) throw new BadRequestException(`Customer "${id}" is blacklisted.`);
  }

  private async resolveLine(
    tenantId: string,
    productId: string,
    requestedQuantity: number,
    preferredItemId: string | null,
    period: DateRange,
    tenancyInputs: RentalTenancyPricingView,
  ): Promise<ResolvedLine> {
    const product = await this.productQuery.findRentalProductById(productId);
    if (!product) {
      throw new BadRequestException(`Product not found.`);
    }

    const { isOverRental, candidateItems } = await this.resolveAvailability(
      tenantId,
      product,
      requestedQuantity,
      preferredItemId,
      period,
    );

    // Speculative tier resolution: pass the top-ranked candidate's item ID so the
    // PricingEngine can apply item-level tier overrides when they exist.
    //
    // V1 known limitation: if this candidate is claimed by a concurrent booking,
    // the assigned item may differ from the one used for pricing. This is an
    // accepted tradeoff — item-level tier overrides are rare in practice.
    // Documented in ADR §9. The scopedItemId is unused by the engine in this
    // iteration since PricingEngineInput does not carry it — left as a comment
    // for when item-level tier resolution is wired into the engine.
    const priceBreakdown = this.pricingEngine.calculate({
      startDate: period.start,
      endDate: period.end,
      tiers: product.pricingTiers,
      units: tenancyInputs.billingUnits,
      config: tenancyInputs.pricingConfig,
    });

    // pricePerUnit is a Money instance on TierSnapshot — no conversion needed.
    const unitPrice = priceBreakdown.tierApplied.pricePerUnit;
    const currency = priceBreakdown.total.currency;

    if (currency !== tenancyInputs.pricingConfig.defaultCurrency) {
      throw new BadRequestException(
        `Product "${product.id}" is priced in ${currency}, but this account operates in ${tenancyInputs.pricingConfig.defaultCurrency}.`,
      );
    }

    return {
      productId,
      trackingType: product.trackingType,
      requestedQuantity,
      candidateItems,
      isOverRental,
      priceBreakdown,
      unitPrice,
      currency,
    };
  }

  /**
   * Delegates to AvailabilityService and maps the result to the two flags
   * this handler cares about: isOverRental and candidateItemIds.
   *
   * Status mapping:
   *   AVAILABLE        → isOverRental: false, candidates from service result
   *   OVERBOOK_WARNING → isOverRental: true,  candidateItemIds: []
   *   UNAVAILABLE      → throws ConflictException (hard stop)
   *
   * Preferred item hint: when provided, the hinted item ID is moved to the
   * front of the candidate list so the transaction tries it first.
   */
  private async resolveAvailability(
    tenantId: string,
    product: RentalProductView,
    requestedQuantity: number,
    preferredItemId: string | null,
    period: DateRange,
  ): Promise<{ isOverRental: boolean; candidateItems: CandidateItem[] }> {
    const result = await this.availabilityService.check({
      tenantId,
      productId: product.id,
      requestedQuantity,
      range: period,
      trackingType: product.trackingType,
    });

    this.logger.debug(`Availability result: ${result.status}`, 'CreateBookingCommand');

    if (result.status === AvailabilityStatus.UNAVAILABLE) {
      throw new ConflictException(`Product '${product.id}' is unavailable for the requested period and quantity.`);
    }

    if (result.status === AvailabilityStatus.OVERBOOK_WARNING) {
      return { isOverRental: true, candidateItems: [] };
    }

    // AVAILABLE: Rank candidates (Preferred Item Hint)
    const candidates = result.candidateItems;
    const ranked = preferredItemId
      ? [
          // Move preferred to front if exists
          ...candidates.filter((c) => c.id === preferredItemId),
          ...candidates.filter((c) => c.id !== preferredItemId),
        ]
      : candidates;

    return { isOverRental: false, candidateItems: ranked };
  }

  /**
   * ADR 012 MVP Implementation:
   * Selects the top candidate. No retry loop.
   * Concurrency conflicts are handled by the database constraint.
   */
  private buildLineItem(line: ResolvedLine): BookingLineItem {
    // BULK: No owner (aggregate root is product, not item)
    if (line.trackingType === TrackingType.BULK) {
      return BookingLineItem.create({
        productId: line.productId,
        inventoryItemId: null,
        quantityRented: line.requestedQuantity,
        unitPrice: line.unitPrice,
        ownerId: null, // BULK items have no owner at line level
        isExternallySourced: false,
        priceBreakdown: line.priceBreakdown,
      });
    }

    // OVER-RENTAL: No physical item, no owner
    if (line.isOverRental) {
      return BookingLineItem.create({
        productId: line.productId,
        inventoryItemId: null,
        quantityRented: line.requestedQuantity,
        unitPrice: line.unitPrice,
        ownerId: null, // Over-rental has no owner
        isExternallySourced: true,
        priceBreakdown: line.priceBreakdown,
      });
    }

    // SERIALIZED: Pick top candidate and snapshot ownerId
    const selectedItem = line.candidateItems[0];

    if (!selectedItem) {
      throw new ConflictException(`Race condition: Item claimed during transaction.`);
    }

    return BookingLineItem.create({
      productId: line.productId,
      inventoryItemId: selectedItem.id,
      quantityRented: line.requestedQuantity,
      unitPrice: line.unitPrice,
      ownerId: selectedItem.ownerId, // SNAPSHOT from inventory read
      isExternallySourced: false,
      priceBreakdown: line.priceBreakdown,
    });
  }
}
