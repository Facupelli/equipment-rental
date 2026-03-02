import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { TrackingType } from '@repo/types';
import { Order } from '../../domain/entities/order.entity';

export abstract class OrderRepositoryPort {
  abstract findById(id: string, currency: string): Promise<Order | null>;
  abstract save(booking: Order): Promise<string>;

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
