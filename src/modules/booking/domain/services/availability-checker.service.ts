import { Injectable, Inject } from "@nestjs/common";
import {
  IReservationRepository,
  RESERVATION_REPOSITORY,
} from "../repositories/reservation.repository.interface";
import { ReservationStatus } from "../entities/reservation.entity";
import { TimeRange } from "../value-objects/time-range.vo";

interface AvailabilityCheckParams {
  equipmentTypeId: string;
  timeRange: TimeRange;
  quantity: number;
  totalInventory: number;
}

interface ReservationEvent {
  timestamp: Date;
  quantity: number;
  type: "start" | "end";
}

/**
 * Domain Service: Availability Checker
 *
 * Encapsulates the complex algorithm for checking equipment availability
 * Uses interval decomposition (sweep line algorithm) to find peak concurrent usage
 *
 * Time complexity: O(n log n) where n = number of overlapping reservations
 */
@Injectable()
export class AvailabilityCheckerService {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository
  ) {}

  /**
   * Check if equipment is available for the requested time range and quantity
   */
  async checkAvailability(params: AvailabilityCheckParams): Promise<boolean> {
    const { equipmentTypeId, timeRange, quantity, totalInventory } = params;

    // Get overlapping reservations (only confirmed and pending)
    const overlappingReservations =
      await this.reservationRepository.findOverlapping(
        equipmentTypeId,
        timeRange.start,
        timeRange.end,
        [ReservationStatus.CONFIRMED, ReservationStatus.PENDING]
      );

    // Calculate peak concurrent usage
    const peakUsage = this.calculatePeakConcurrent(
      overlappingReservations.map((r) => ({
        start: r.startDateTime,
        end: r.endDateTime,
        quantity: r.quantity,
      })),
      timeRange.start,
      timeRange.end
    );

    // Check if we have capacity
    return peakUsage + quantity <= totalInventory;
  }

  /**
   * Calculate maximum concurrent reservations within a time range
   *
   * Algorithm: Interval Decomposition (Sweep Line)
   * 1. Create start/end events for each reservation
   * 2. Sort events by timestamp
   * 3. Sweep through events, tracking current usage
   * 4. Return maximum usage encountered
   */
  private calculatePeakConcurrent(
    reservations: Array<{ start: Date; end: Date; quantity: number }>,
    queryStart: Date,
    queryEnd: Date
  ): number {
    const events: ReservationEvent[] = [];

    // Create events for each reservation (clipped to query range)
    for (const res of reservations) {
      const start = res.start > queryStart ? res.start : queryStart;
      const end = res.end < queryEnd ? res.end : queryEnd;

      // Only add if there's valid overlap
      if (start < end) {
        events.push({
          timestamp: start,
          quantity: res.quantity,
          type: "start",
        });
        events.push({
          timestamp: end,
          quantity: res.quantity,
          type: "end",
        });
      }
    }

    // Sort events by timestamp
    // If same timestamp, process 'end' before 'start' (return before pickup)
    events.sort((a, b) => {
      const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
      if (timeDiff !== 0) return timeDiff;

      // Same timestamp: end events first
      return a.type === "end" ? -1 : 1;
    });

    // Sweep through events to find peak
    let currentUsage = 0;
    let peakUsage = 0;

    for (const event of events) {
      if (event.type === "start") {
        currentUsage += event.quantity;
        peakUsage = Math.max(peakUsage, currentUsage);
      } else {
        currentUsage -= event.quantity;
      }
    }

    return peakUsage;
  }

  /**
   * Get detailed availability info (for debugging/admin)
   */
  async getAvailabilityDetails(params: AvailabilityCheckParams) {
    const { equipmentTypeId, timeRange, quantity, totalInventory } = params;

    const overlappingReservations =
      await this.reservationRepository.findOverlapping(
        equipmentTypeId,
        timeRange.start,
        timeRange.end,
        [ReservationStatus.CONFIRMED, ReservationStatus.PENDING]
      );

    const peakUsage = this.calculatePeakConcurrent(
      overlappingReservations.map((r) => ({
        start: r.startDateTime,
        end: r.endDateTime,
        quantity: r.quantity,
      })),
      timeRange.start,
      timeRange.end
    );

    return {
      isAvailable: peakUsage + quantity <= totalInventory,
      totalInventory,
      peakUsage,
      requestedQuantity: quantity,
      remainingCapacity: totalInventory - peakUsage,
      overlappingReservationsCount: overlappingReservations.length,
    };
  }
}
