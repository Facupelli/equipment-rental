import { Injectable } from '@nestjs/common';
import { CandidateItem, RentalInventoryReadPort } from '../domain/ports/rental-inventory-read.port';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { TenantConfigPort } from '../../tenancy/domain/ports/tenant-config.port';
import { BookingRepository } from '../domain/ports/booking.repository';
import { TrackingType } from '@repo/types';

export interface CheckAvailabilityParams {
  productId: string;
  tenantId: string;
  requestedQuantity: number;
  range: DateRange;
  trackingType: TrackingType;
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  OVERBOOK_WARNING = 'OVERBOOK_WARNING',
  UNAVAILABLE = 'UNAVAILABLE',
}

export type AvailabilityResult =
  | { status: AvailabilityStatus.AVAILABLE; availableQuantity: number; candidateItems: CandidateItem[] }
  | { status: AvailabilityStatus.OVERBOOK_WARNING; deficit: number }
  | { status: AvailabilityStatus.UNAVAILABLE; reason: string };

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly inventoryRead: RentalInventoryReadPort,
    private readonly tenancyQuery: TenantConfigPort,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async check(params: CheckAvailabilityParams): Promise<AvailabilityResult> {
    const { productId, tenantId, requestedQuantity, range, trackingType } = params;

    // Step 1 — Total rentable supply (excludes RETIRED items)
    const totalQuantity = await this.inventoryRead.getTotalQuantity(productId, tenantId);

    // Step 2 — Units blocked by blackout periods in the requested range
    const blackedOutQuantity = await this.inventoryRead.getBlackedOutQuantity(productId, tenantId, range);

    // Step 3 — Units already committed in confirmed bookings overlapping the range
    const bookedQuantity = await this.bookingRepository.getBookedQuantity(productId, tenantId, range, trackingType);

    // Step 4 — Net available units
    const netAvailable = totalQuantity - blackedOutQuantity - bookedQuantity;

    // Step 5a — Sufficient stock: straightforward approval
    if (netAvailable >= requestedQuantity) {
      const candidateItems: CandidateItem[] = [];

      if (trackingType === TrackingType.SERIALIZED) {
        const items = await this.inventoryRead.getCandidateItems(productId, tenantId, range);
        candidateItems.push(...items);
      }

      return {
        status: AvailabilityStatus.AVAILABLE,
        availableQuantity: netAvailable,
        candidateItems,
      };
    }

    // Step 5b — Insufficient stock: consult tenant config for over-rental rules
    const tenantConfig = await this.tenancyQuery.findPricingInputs(tenantId);
    const config = tenantConfig?.pricingConfig;

    if (!config?.overRentalEnabled) {
      return {
        status: AvailabilityStatus.UNAVAILABLE,
        reason: `Insufficient stock. Requested ${requestedQuantity}, available ${netAvailable}.`,
      };
    }

    const deficit = requestedQuantity - netAvailable;

    // TODO: The Threshold Logic (Absolute vs. Percentage) this is assuming absolute value. what if it is a procetnage?
    if (deficit > config.maxOverRentThreshold) {
      return {
        status: AvailabilityStatus.UNAVAILABLE,
        reason: `Over-rental threshold exceeded. Deficit of ${deficit} surpasses the maximum allowed threshold of ${config.maxOverRentThreshold}.`,
      };
    }

    return { status: AvailabilityStatus.OVERBOOK_WARNING, deficit };
  }
}
