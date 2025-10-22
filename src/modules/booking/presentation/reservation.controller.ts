import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
} from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import  { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateReservationCommand } from "../application/commands/create-reservation/create-reservation.command";
// biome-ignore lint: /style/useImportType
import  { CreateReservationDto } from "../application/commands/create-reservation/create-reservation.dto";
// biome-ignore lint: /style/useImportType
import  {
	AvailabilityResponseDto,
	CheckAvailabilityDto,
} from "../application/queries/check-availability/check-availability.dto";
import { CheckAvailabilityQuery } from "../application/queries/check-availability/check-availability.query";

/**
 * Responsibilities:
 * - Handle HTTP requests
 * - Validate input (via Zod DTOs)
 * - Dispatch commands/queries to application layer
 * - Return HTTP responses
 *
 * Does NOT contain business logic!
 */
@Controller("reservations")
export class ReservationController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	/**
	 * Check if equipment is available
	 * GET /bookings/availability?equipmentTypeId=...&startDateTime=...&endDateTime=...&quantity=...
	 */
	@Get("availability")
  @HttpCode(HttpStatus.OK)
  async checkAvailability(
    @Query() query: CheckAvailabilityDto
  ): Promise<AvailabilityResponseDto> {
    const result = await this.queryBus.execute(
      new CheckAvailabilityQuery(
        query.equipmentTypeId,
        query.startDateTime,
        query.endDateTime,
        query.quantity
      )
    );

    return {
      isAvailable: result.isAvailable,
      totalInventory: result.totalInventory,
      peakUsage: result.peakUsage,
      requestedQuantity: result.requestedQuantity,
      remainingCapacity: result.remainingCapacity,
    };
  }

	/**
	 * Create a new reservation
	 * POST /bookings
	 */
	@Post()
  @HttpCode(HttpStatus.CREATED)
  async createReservation(
    @Body() dto: CreateReservationDto
  ): Promise<{ reservationId: string }> {
    const reservationId = await this.commandBus.execute(
      new CreateReservationCommand(
        dto.customerId,
        dto.equipmentTypeId,
        dto.startDate,
        dto.endDate,
        dto.quantity,
        dto.notes
      )
    );

    return { reservationId };
  }

	// TODO: Add more endpoints
	// - GET /bookings/:id (get reservation details)
	// - GET /bookings (list reservations)
	// - POST /bookings/:id/confirm (confirm reservation)
	// - POST /bookings/:id/cancel (cancel reservation)
}
