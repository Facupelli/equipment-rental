import { ConflictException } from '@nestjs/common';

export type ConflictReason =
  | 'SERIALIZED_NO_UNIT_AVAILABLE' // no operational, unblocked, unbooked unit exists for this product
  | 'SERIALIZED_UNIT_UNAVAILABLE' // a pre-selected specific unit is already booked or blacked out
  | 'BULK_INSUFFICIENT_STOCK'; // available qty < requested qty

export interface AvailabilityConflict {
  productId: string;
  inventoryItemId?: string; // populated for SERIALIZED_UNIT_UNAVAILABLE only
  reason: ConflictReason;
  // BULK_INSUFFICIENT_STOCK only
  requested?: number;
  available?: number;
}

export class AvailabilityException extends ConflictException {
  constructor(public readonly conflicts: AvailabilityConflict[]) {
    super({ message: 'One or more items are unavailable for the requested period', conflicts });
  }
}
