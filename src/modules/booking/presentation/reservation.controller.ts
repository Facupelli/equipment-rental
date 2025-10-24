import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
} from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateReservationCommand } from "../application/commands/create-reservation/create-reservation.command";
// biome-ignore lint: /style/useImportType
import { CreateReservationDto } from "../application/commands/create-reservation/create-reservation.dto";
// biome-ignore lint: /style/useImportType
import {
	AvailabilityResponseDto,
	CheckAvailabilityDto,
} from "../application/queries/check-availability/check-availability.dto";
import { CheckAvailabilityQuery } from "../application/queries/check-availability/check-availability.query";
// biome-ignore lint: /style/useImportType
import  {
	FindInRangeDto,
	FindInRangeResponseDTO,
} from "../application/queries/find-in-range/find-in-range.dto";
import { FindInRangeQuery } from "../application/queries/find-in-range/find-in-range.query";
// biome-ignore lint: /style/useImportType
import { GetCustomerBookingsDto } from "../application/queries/get-customer-bookings/get-customer-bookings.dto";
import { GetCustomerBookingsQuery } from "../application/queries/get-customer-bookings/get-customer-bookings.query";
// biome-ignore lint: /style/useImportType
import { GetDetailByIdDto } from "../application/queries/get-detail-by-id/get-detail-by-id.dto";
import { GetDetailByIdQuery } from "../application/queries/get-detail-by-id/get-detail-by-id.query";
import type { ReservationOrder } from "../domain/models/reservation-order.model";

@Controller("reservations")
export class ReservationController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

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

	@Get("calendar")
  async getAllBookings(
    @Query() query: FindInRangeDto
  ): Promise<FindInRangeResponseDTO[]> {
    const bookings = await this.queryBus.execute(
      new FindInRangeQuery(query.startDate, query.endDate, query.statuses)
    );

    return bookings
  }

	@Get("customer")
  async getCustomerBookings(
    @Query() query: GetCustomerBookingsDto
  ): Promise<ReservationOrder[]> {
    const bookings = await this.queryBus.execute(
      new GetCustomerBookingsQuery(query.customerId)
    );

    return bookings
  }

	@Get(":orderId")
  async getDetailById(
    @Param() params: GetDetailByIdDto
  ): Promise<ReservationOrder> {
    const order = await this.queryBus.execute(
      new GetDetailByIdQuery(params.orderId)
    );

    return order
  }

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
}
