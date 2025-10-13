import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { BadRequestException } from "@nestjs/common";
import { CheckAvailabilityQuery } from "./check-availability.query";
import { TimeRange } from "../../../domain/value-objects/time-range.vo";
import { AvailabilityCheckerService } from "../../../domain/services/availability-checker.service";

interface AvailabilityResult {
  isAvailable: boolean;
  totalInventory: number;
  peakUsage: number;
  requestedQuantity: number;
  remainingCapacity: number;
  overlappingReservationsCount: number;
}

/**
 * Check Availability Query Handler (Use Case)
 *
 * Pure read operation - no side effects
 * Returns detailed availability information
 */
@QueryHandler(CheckAvailabilityQuery)
export class CheckAvailabilityHandler
  implements IQueryHandler<CheckAvailabilityQuery, AvailabilityResult>
{
  constructor(
    private readonly availabilityChecker: AvailabilityCheckerService
  ) // TODO: Inject InventoryFacade to get total inventory
  {}

  async execute(query: CheckAvailabilityQuery): Promise<AvailabilityResult> {
    // 1. Create time range value object
    const timeRangeResult = TimeRange.create(
      query.startDateTime,
      query.endDateTime
    );

    if (timeRangeResult.isFailure) {
      throw new BadRequestException(timeRangeResult.error);
    }

    const timeRange = timeRangeResult.value;

    // 2. Get detailed availability info
    // TODO: Get totalInventory from Inventory module
    const totalInventory = 10; // Placeholder

    const availabilityDetails =
      await this.availabilityChecker.getAvailabilityDetails({
        equipmentTypeId: query.equipmentTypeId,
        timeRange,
        quantity: query.quantity,
        totalInventory,
      });

    return availabilityDetails;
  }
}
