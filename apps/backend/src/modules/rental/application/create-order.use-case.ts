import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TenantContextService } from 'src/modules/tenancy/tenant-context.service';
import { TenantConfigPort } from 'src/modules/tenancy/domain/ports/tenant-config.port';
import { AvailabilityService } from './availability.service';
import { TrackingType } from '@repo/types';
import { PriceBreakdown } from '../domain/value-objects/price-breakdown.vo';
import { PricingEngine } from './pricing-engine/pricing-engine';
import { Money } from '../domain/value-objects/money.vo';
import { AppLogger } from 'src/core/logger/app-logger.service';
import { LogContext } from 'src/core/logger/log-context';
import { CustomerQueryPort } from 'src/modules/customer/application/ports/customer-query.port';
import { CandidateItem } from './ports/rental-inventory-read.port';
import { RentalProductQueryPort } from './ports/rental-product.port';
import { BookingRepository } from './ports/order.repository.port';

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
export class CreateOrderUseCase {
  constructor(
    private readonly logger: AppLogger,
    private readonly tenantContext: TenantContextService,
    private readonly customerQuery: CustomerQueryPort,
    private readonly tenancyQuery: TenantConfigPort,
    private readonly productQuery: RentalProductQueryPort,
    private readonly availabilityService: AvailabilityService,
    private readonly pricingEngine: PricingEngine,
    private readonly bookingRepo: BookingRepository,
  ) {}

  async execute(dto: CreateBookingDto): Promise<string> {
    const tenantId = this.tenantContext.requireTenantId();

    const { customerId, lineItems, startDate, endDate } = dto;
    // const period = DateRange.create(startDate, endDate);

    // ── Enrich canonical log with the intent of this command ──────────────
    LogContext.set('tenantId', tenantId);
    LogContext.set('customerId', customerId);
    LogContext.set('lineItemCount', lineItems.length);
    LogContext.set('rentalStart', startDate);
    LogContext.set('rentalEnd', endDate);
    // ─────────────────────────────────────────────────────────────────────

    const [customer, tenancyPricingInputs] = await Promise.all([
      this.customerQuery.getCustomer(customerId),
      this.tenancyQuery.findPricingInputs(tenantId),
    ]);

    this.validateCustomer(customer, customerId);
    if (!tenancyPricingInputs) {
      throw new NotFoundException(`Tenant '${tenantId}' configuration not found.`);
    }

    // LogContext.set('bookingId', order.id);

    // return order.id;
    return '';
  }

  private validateCustomer(customer: any, id: string) {
    if (!customer) throw new BadRequestException(`Customer "${id}" not found.`);
    if (!customer.canBook) throw new BadRequestException(`Customer "${id}" is blacklisted.`);
  }
}
