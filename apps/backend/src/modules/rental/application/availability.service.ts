import { Injectable } from '@nestjs/common';
import { RentalInventoryReadPort } from '../domain/ports/rental-inventory-read.port';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { TenantConfigPort } from '../domain/ports/tenant-config.port';
import { BookingRepositoryPort } from '../domain/ports/booking.repository.port';
import { TrackingType } from '@repo/types';

export interface CheckAvailabilityParams {
  productId: string;
  tenantId: string;
  requestedQuantity: number;
  range: DateRange;
  trackingType: TrackingType;
}

export type AvailabilityResult =
  | { status: 'AVAILABLE'; availableQuantity: number }
  | { status: 'OVERBOOK_WARNING'; deficit: number }
  | { status: 'UNAVAILABLE'; reason: string };

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly inventoryRead: RentalInventoryReadPort,
    private readonly tenantConfig: TenantConfigPort,
    private readonly bookingRepository: BookingRepositoryPort,
  ) {}

  async checkAvailability(params: CheckAvailabilityParams): Promise<AvailabilityResult> {
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
      return { status: 'AVAILABLE', availableQuantity: netAvailable };
    }

    // Step 5b — Insufficient stock: consult tenant config for over-rental rules
    const config = await this.tenantConfig.getConfig(tenantId);

    if (!config.overRentalEnabled) {
      return {
        status: 'UNAVAILABLE',
        reason: `Insufficient stock. Requested ${requestedQuantity}, available ${netAvailable}.`,
      };
    }

    const deficit = requestedQuantity - netAvailable;

    // TODO: The Threshold Logic (Absolute vs. Percentage) this is assuming absolute value. what if it is a procetnage?
    if (deficit > config.maxOverRentThreshold) {
      return {
        status: 'UNAVAILABLE',
        reason: `Over-rental threshold exceeded. Deficit of ${deficit} surpasses the maximum allowed threshold of ${config.maxOverRentThreshold}.`,
      };
    }

    return { status: 'OVERBOOK_WARNING', deficit };
  }
}
