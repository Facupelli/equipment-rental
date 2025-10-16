import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const CreateReservationSchema = z
	.object({
		customerId: z.uuid("Invalid customer ID"),
		equipmentTypeId: z.uuid("Invalid equipment type ID"),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		quantity: z.number().int().positive("Quantity must be positive"),
		notes: z.string().optional(),
	})
	.refine((data) => data.endDate > data.startDate, {
		message: "End date must be after start date",
		path: ["endDate"],
	})
	.refine((data) => data.startDate > new Date(), {
		message: "Start date must be in the future",
		path: ["startDate"],
	});

export class CreateReservationDto extends createZodDto(
	CreateReservationSchema,
) {}

export class ReservationResponseDto {
	id: string;
	customerId: string;
	equipmentTypeId: string;
	startDate: Date;
	endDate: Date;
	quantity: number;
	status: string;
	quotedPrice?: number;
	notes?: string;
	createdAt: Date;
}
