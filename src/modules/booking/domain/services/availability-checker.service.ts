import { Injectable } from "@nestjs/common";
import { ReservationOrderRepository } from "../../infrastructure/persistance/typeorm/reservation-order.repository";

interface AvailabilityCheckParams {
  equipmentTypeId: string;
  startDateTime: Date;
  endDateTime: Date;
  quantity: number;
  totalInventory: number;
  bufferDays: number;
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
    private readonly reservationOrderRepository: ReservationOrderRepository
  ) {}

  /**
   * Check if equipment is available for the requested time range and quantity
   */
  async checkAvailability(params: AvailabilityCheckParams) {
    const {
      equipmentTypeId,
      bufferDays,
      startDateTime,
      endDateTime,
      quantity,
      totalInventory,
    } = params;

    const bookedCount =
      await this.reservationOrderRepository.getBookedItemsCount(
        equipmentTypeId,
        startDateTime,
        endDateTime,
        bufferDays
      );

    // Calculate available capacity
    const availableCapacity = Math.max(0, totalInventory - bookedCount);

    return {
      totalInventory,
      bookedCount,
      availableCapacity,
    };
  }
}
