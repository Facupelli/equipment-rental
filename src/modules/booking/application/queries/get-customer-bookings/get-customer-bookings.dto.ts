import { createZodDto } from "nestjs-zod";
import { ReservationOrderStatus } from "src/modules/booking/domain/models/reservation-order.model";
import z from "zod";

const GetCustomerBookingsSchema = z.object({
	customerId: z.uuid("Invalid Customer ID"),
	status: z.enum(ReservationOrderStatus).optional(),
	includeCompleted: z.coerce.boolean().optional(),
	fromDate: z.coerce.date().optional(),
	toDate: z.coerce.date().optional(),
	limit: z.number().optional(),
	offset: z.number().optional(),
});

export class GetCustomerBookingsDto extends createZodDto(
	GetCustomerBookingsSchema,
) {}
