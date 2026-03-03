export interface BlackoutConflict {
  blackoutId: string;
  reason: string;
}

export interface SerializedItemRef {
  id: string;
  status: string;
}

export abstract class InventoryAvailabilityPort {
  /**
   * Returns all blackout periods overlapping the given range for a specific
   * serialized inventory item.
   *
   * @param inventoryItemId - The specific unit to check.
   * @param range           - A valid tstzrange literal, e.g. '[2025-01-01,2025-01-10)'.
   * @param tenantId        - Mandatory tenant scoping.
   */
  abstract getBlackoutsForItem(inventoryItemId: string, range: string, tenantId: string): Promise<BlackoutConflict[]>;

  /**
   * Returns all blackout periods overlapping the given range for a bulk product,
   * plus the total blocked quantity across those periods.
   *
   * @param productId - The bulk product to check.
   * @param range     - A valid tstzrange literal.
   * @param tenantId  - Mandatory tenant scoping.
   */
  abstract getBlackoutsForProduct(
    productId: string,
    range: string,
    tenantId: string,
  ): Promise<{ conflicts: BlackoutConflict[]; blockedQuantity: number }>;

  /**
   * Returns a lightweight list of all inventory items belonging to a serialized
   * product. Used by AvailabilityService to iterate and find a free unit.
   *
   * @param productId - The serialized product whose items to list.
   * @param tenantId  - Mandatory tenant scoping.
   */
  abstract getSerializedItemsForProduct(productId: string, tenantId: string): Promise<SerializedItemRef[]>;

  /**
   * Returns the totalStock of a bulk product.
   * Keeps AvailabilityService self-contained — it does not need a full product fetch.
   *
   * @param productId - The bulk product.
   * @param tenantId  - Mandatory tenant scoping.
   */
  abstract getBulkProductStock(productId: string, tenantId: string): Promise<number>;
}
