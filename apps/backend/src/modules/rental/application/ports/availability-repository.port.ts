import { TrackingType } from '@repo/types';
import { AvailabilityConflict } from '../exceptions/availability.exceptions';

export const AVAILABILITY_REPOSITORY = Symbol('AVAILABILITY_REPOSITORY');

export abstract class AvailabilityRepositoryPort {
  /**
   * Finds the first OPERATIONAL unit for the product that has no overlapping
   * booking and no overlapping blackout period, excluding units already
   * assigned earlier in this same call.
   */
  abstract autoAssign(
    candidate: SerializedCandidate,
    range: string,
    tenantId: string,
    assignedUnitIds: Set<string>,
  ): Promise<{ candidate: ResolvedSerializedCandidate } | { conflict: AvailabilityConflict }>;

  /**
   * Verifies that a staff-pre-selected unit is free for the range.
   * Note: booking_range is now denormalized onto bookings, so no orders JOIN needed.
   */
  abstract checkPreSelectedUnit(
    candidate: SerializedCandidate & { inventoryItemId: string },
    range: string,
    tenantId: string,
  ): Promise<{ candidate: ResolvedSerializedCandidate } | { conflict: AvailabilityConflict }>;

  abstract checkBulk(
    candidate: BulkCandidate,
    range: string,
    tenantId: string,
  ): Promise<{ candidate: ResolvedBulkCandidate } | { conflict: AvailabilityConflict }>;
}

export type SerializedCandidate = {
  trackingType: TrackingType.SERIALIZED;
  productId: string;
  inventoryItemId: string | null; // null = needs auto-assignment
  bundleId?: string;
};

export type BulkCandidate = {
  trackingType: TrackingType.BULK;
  productId: string;
  quantity: number;
  totalStock: number; // passed in from the Use Case — service does not fetch products
  bundleId?: string;
};

export type BookingCandidate = SerializedCandidate | BulkCandidate;

// A ResolvedCandidate is the same shape but with inventoryItemId guaranteed
// to be a string (never null) on the SERIALIZED branch.
export type ResolvedSerializedCandidate = Omit<SerializedCandidate, 'inventoryItemId'> & {
  inventoryItemId: string;
};

export type ResolvedBulkCandidate = BulkCandidate;

export type ResolvedCandidate = ResolvedSerializedCandidate | ResolvedBulkCandidate;
