import { Injectable } from '@nestjs/common';
import {
  AvailabilityRepositoryPort,
  BookingCandidate,
  ResolvedCandidate,
  ResolvedSerializedCandidate,
  SerializedCandidate,
} from './ports/availability-repository.port';
import { AvailabilityConflict, AvailabilityException } from './exceptions/availability.exceptions';
import { formatPostgresRange } from 'src/core/utils/postgres-range.util';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';

@Injectable()
export class AvailabilityService {
  constructor(private readonly availabilityRepo: AvailabilityRepositoryPort) {}

  /**
   * Checks availability for every candidate and, for SERIALIZED candidates
   * without a pre-selected unit, auto-assigns the first available one.
   *
   * Collects ALL conflicts before throwing — never short-circuits — so the
   * caller receives a complete picture of what is unavailable.
   *
   * @returns Fully resolved candidates (no null inventoryItemId).
   * @throws  AvailabilityException carrying every AvailabilityConflict found.
   */
  async checkAndResolve(
    candidates: BookingCandidate[],
    bookingRange: DateRange,
    tenantId: string,
  ): Promise<ResolvedCandidate[]> {
    if (candidates.length === 0) return [];

    const range = formatPostgresRange(bookingRange);

    // Track units assigned within this call to prevent assigning the same
    // physical unit to two candidates (e.g. same product in bundle + direct).
    const assignedUnitIds = new Set<string>();

    // Run all checks concurrently and collect results.
    const results = await Promise.all(
      candidates.map((candidate) =>
        candidate.trackingType === 'SERIALIZED'
          ? this.checkSerialized(candidate, range, tenantId, assignedUnitIds)
          : this.availabilityRepo.checkBulk(candidate, range, tenantId),
      ),
    );

    // Separate resolved candidates from conflicts.
    const conflicts: AvailabilityConflict[] = [];
    const resolved: ResolvedCandidate[] = [];

    for (const result of results) {
      if ('conflict' in result) {
        conflicts.push(result.conflict);
      } else {
        resolved.push(result.candidate);
      }
    }

    if (conflicts.length > 0) {
      throw new AvailabilityException(conflicts);
    }

    return resolved;
  }

  // ---------------------------------------------------------------------------
  // SERIALIZED
  // ---------------------------------------------------------------------------

  private async checkSerialized(
    candidate: SerializedCandidate,
    range: string,
    tenantId: string,
    assignedUnitIds: Set<string>,
  ): Promise<{ candidate: ResolvedSerializedCandidate } | { conflict: AvailabilityConflict }> {
    if (candidate.inventoryItemId === null) {
      return this.availabilityRepo.autoAssign(candidate, range, tenantId, assignedUnitIds);
    }
    return this.availabilityRepo.checkPreSelectedUnit(
      candidate as SerializedCandidate & { inventoryItemId: string },
      range,
      tenantId,
    );
  }
}
