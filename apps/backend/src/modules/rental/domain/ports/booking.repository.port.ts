import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { Booking } from '../entities/booking.entity';
import { TrackingType } from '@repo/types';

export abstract class BookingRepositoryPort {
  abstract findById(id: string, currency: string): Promise<Booking | null>;
  abstract save(booking: Booking): Promise<string>;

  /**
   * Returns the total quantity already booked for a product within the given range,
   * excluding CANCELLED and COMPLETED bookings.
   *
   * Counting semantics differ by tracking type:
   * - SERIALIZED: counts distinct inventory_item_ids (each unit is a unique physical asset).
   * - BULK: sums quantity_rented (units are fungible within the same pool).
   */
  abstract getBookedQuantity(
    productId: string,
    tenantId: string,
    range: DateRange,
    trackingType: TrackingType,
  ): Promise<number>;
}
