import { createZodDto } from "nestjs-zod";
import {
	ACTIVE_STATUSES,
	ReservationOrderStatus,
} from "src/modules/booking/domain/models/reservation-order.model";
import z from "zod";

const FindInRangeSchema = z
	.object({
		startDate: z.iso.datetime().transform((s) => new Date(s)),
		endDate: z.iso.datetime().transform((s) => new Date(s)),
		statuses: z
			.array(z.enum(ReservationOrderStatus))
			.optional()
			.default(ACTIVE_STATUSES as unknown as ReservationOrderStatus[]),
	})
	.refine(({ startDate, endDate }) => startDate <= endDate, {
		message: "startDate cannot be later than endDate",
		path: ["startDate"],
	});

export class FindInRangeDto extends createZodDto(FindInRangeSchema) {}

export interface FindInRangeResponseDTO {
	orderId: string;
	itemId: string;
	equipmentTypeId: string;
	quantity: number;
	startDate: Date;
	endDate: Date;
	status: ReservationOrderStatus;
	customerId: string;
}
