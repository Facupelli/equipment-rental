import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RentalCustomerQueryPort } from '../domain/ports/rental-customer.port';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { RentalTenancyPricingView, TenantConfigPort } from 'src/modules/tenancy/domain/ports/tenant-config.port';
import { RentalProductQueryPort, RentalProductView } from '../domain/ports/rental-product.port';
import { AvailabilityService, AvailabilityStatus } from './availability.service';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { BookingStatus, TrackingType } from '@repo/types';
import { PriceBreakdown } from '../domain/value-objects/price-breakdown.vo';
import { PricingEngine } from './pricing-engine/pricing-engine';
import { Money } from '../domain/value-objects/money.vo';
import { Booking } from '../domain/entities/booking.entity';
import { BookingLineItem } from '../domain/entities/booking-line-item.entity';
import { BookingRepository } from '../domain/ports/booking.repository';

const PG_EXCLUSION_VIOLATION = '23P01';

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
  candidateItemIds: string[];

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
    private readonly tenantContext: TenantContextService,
    private readonly customerQuery: RentalCustomerQueryPort,
    private readonly tenancyQuery: TenantConfigPort,
    private readonly productQuery: RentalProductQueryPort,
    private readonly availabilityService: AvailabilityService,
    private readonly pricingEngine: PricingEngine,
    private readonly bookingRepo: BookingRepository,
  ) {}

  async execute(command: CreateBookingDto): Promise<string> {
    const tenantId = this.tenantContext.getTenantId();

    if (tenantId === undefined) {
      throw new BadRequestException(
        'No tenant context found. Ensure the request passed through TenantMiddleware, or use `prismaService` directly for system-level operations.',
      );
    }

    const { customerId, lineItems, startDate, endDate, notes } = command;
    const period = DateRange.create(startDate, endDate);

    const [customer, tenancyPricingInputs] = await Promise.all([
      this.customerQuery.findById(customerId),
      this.tenancyQuery.findPricingInputs(tenantId),
    ]);

    if (!customer) {
      throw new BadRequestException(`Customer "${customerId}" not found.`);
    }
    if (!customer.canBook) {
      throw new BadRequestException(`Customer "${customerId}" is blacklisted and cannot make bookings.`);
    }
    if (!tenancyPricingInputs) {
      throw new NotFoundException(`Tenant '${tenantId}' not found or has no pricing configuration.`);
    }

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

    // All line items on a single booking must share one currency.
    // Mixed currencies would make subtotal / grandTotal meaningless.
    const currencies = [...new Set(resolvedLines.map((l) => l.currency))];
    if (currencies.length > 1) {
      throw new BadRequestException(`All line items must share the same currency. Found: ${currencies.join(', ')}.`);
    }
    const currency = currencies[0];

    // Conservative status derivation: if ANY line is an over-rental the whole
    // booking requires admin confirmation before sourcing equipment externally.
    const bookingStatus: BookingStatus.RESERVED | BookingStatus.PENDING_CONFIRMATION = resolvedLines.some(
      (l) => l.isOverRental,
    )
      ? BookingStatus.PENDING_CONFIRMATION
      : BookingStatus.RESERVED;

    const bookingLineItems = await this.buildLineItems(resolvedLines);

    const booking = Booking.create({
      tenantId,
      customerId,
      rentalPeriod: period,
      lineItems: bookingLineItems,
      currency,
      status: bookingStatus,
      notes,
    });

    await this.bookingRepo.save(booking);

    return booking.id;
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

    const { isOverRental, candidateItemIds } = await this.resolveAvailability(
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

    return {
      productId,
      trackingType: product.trackingType,
      requestedQuantity,
      candidateItemIds,
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
  ): Promise<{ isOverRental: boolean; candidateItemIds: string[] }> {
    const result = await this.availabilityService.check({
      tenantId,
      productId: product.id,
      requestedQuantity,
      range: period,
      trackingType: product.trackingType,
    });

    if (result.status === AvailabilityStatus.UNAVAILABLE) {
      throw new ConflictException(`Product '${product.id}' is unavailable for the requested period and quantity.`);
    }

    if (result.status === AvailabilityStatus.OVERBOOK_WARNING) {
      return { isOverRental: true, candidateItemIds: [] };
    }

    // AVAILABLE — apply the preferred item hint to the front of the ranked list.
    const candidates: string[] = result.candidateItemIds ?? [];
    const ranked =
      preferredItemId && candidates.includes(preferredItemId)
        ? [preferredItemId, ...candidates.filter((id) => id !== preferredItemId)]
        : candidates;

    return { isOverRental: false, candidateItemIds: ranked };
  }

  private async buildLineItems(resolvedLines: ResolvedLine[]): Promise<BookingLineItem[]> {
    return Promise.all(resolvedLines.map((line) => this.buildLineItem(line)));
  }

  private async buildLineItem(line: ResolvedLine): Promise<BookingLineItem> {
    if (line.isOverRental || line.trackingType === TrackingType.BULK) {
      return BookingLineItem.create({
        bookingId: '',
        productId: line.productId,
        inventoryItemId: null,
        quantityRented: line.requestedQuantity,
        unitPrice: line.unitPrice,
        ownerId: null,
        isExternallySourced: false,
        priceBreakdown: line.priceBreakdown,
      });
    }

    // SERIALIZED: try each ranked candidate in order.
    for (const itemId of line.candidateItemIds) {
      try {
        return BookingLineItem.create({
          bookingId: '',
          productId: line.productId,
          inventoryItemId: itemId,
          quantityRented: line.requestedQuantity,
          unitPrice: line.unitPrice,
          ownerId: null, // Resolved by the repository from InventoryItem
          isExternallySourced: false,
          priceBreakdown: line.priceBreakdown,
        });
      } catch (err) {
        if (this.isExclusionViolation(err)) {
          continue; // Candidate claimed concurrently — try the next
        }
        throw err;
      }
    }

    throw new ConflictException(
      `No available items remain for product '${line.productId}'. ` +
        `All candidates were claimed by concurrent bookings. Please try again.`,
    );
  }

  /**
   * Returns true when the error is a Postgres exclusion constraint violation.
   * Code 23P01 is raised by the EXCLUDE USING GIST constraint on
   * booking_line_items that prevents overlapping bookings on the same physical item.
   */
  private isExclusionViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as Record<string, unknown>).code === PG_EXCLUSION_VIOLATION
    );
  }
}
