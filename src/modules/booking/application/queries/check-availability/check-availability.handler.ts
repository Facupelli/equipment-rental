import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { BadRequestException } from "@nestjs/common";
import { CheckAvailabilityQuery } from "./check-availability.query";
import { AvailabilityCheckerService } from "../../../domain/services/availability-checker.service";
import { InventoryFacade } from "src/modules/inventory/inventory.facade";
import { validateDateRange } from "src/shared/utils/date-range.utils";

/**
 * Check Availability Query Handler (Use Case)
 *
 * Pure read operation - no side effects
 * Returns detailed availability information
 */
@QueryHandler(CheckAvailabilityQuery)
export class CheckAvailabilityHandler
  implements IQueryHandler<CheckAvailabilityQuery, any>
{
  constructor(
    private readonly availabilityChecker: AvailabilityCheckerService,
    private readonly inventoryFacade: InventoryFacade
  ) {}

  async execute(query: CheckAvailabilityQuery) {
    try {
      validateDateRange(query.startDateTime, query.endDateTime);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 2. Get detailed availability info
    const totalInventory = await this.inventoryFacade.getTotalCapacity(
      query.equipmentTypeId
    );

    const availabilityDetails =
      await this.availabilityChecker.checkAvailability({
        equipmentTypeId: query.equipmentTypeId,
        endDateTime: query.endDateTime,
        startDateTime: query.startDateTime,
        quantity: query.quantity,
        totalInventory,
        // TODO
        bufferDays: 0,
      });

    return availabilityDetails;
  }
}
