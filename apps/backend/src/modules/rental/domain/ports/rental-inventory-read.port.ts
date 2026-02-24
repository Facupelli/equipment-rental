import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';

export abstract class RentalInventoryReadPort {
  /**
   * Returns the total rentable quantity for a given product,
   * summing `total_quantity` across all non-RETIRED inventory items.
   */
  abstract getTotalQuantity(productId: string, tenantId: string): Promise<number>;

  /**
   * Returns the total blocked quantity for a given product within a date range,
   * summing `blocked_quantity` across all blackout_period rows whose
   * `blocked_period` overlaps the requested range.
   *
   * For SERIALIZED items, each blackout row contributes 1.
   * For BULK items, each blackout row contributes its explicit `blocked_quantity`.
   */
  abstract getBlackedOutQuantity(productId: string, tenantId: string, range: DateRange): Promise<number>;
}
