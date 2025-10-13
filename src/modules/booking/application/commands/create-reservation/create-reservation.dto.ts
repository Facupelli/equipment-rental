import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const CreateReservationSchema = z
  .object({
    customerId: z.uuid("Invalid customer ID"),
    equipmentTypeId: z.uuid("Invalid equipment type ID"),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
    quantity: z.number().int().positive("Quantity must be positive"),
    notes: z.string().optional(),
  })
  .refine((data) => data.endDateTime > data.startDateTime, {
    message: "End date must be after start date",
    path: ["endDateTime"],
  })
  .refine((data) => data.startDateTime > new Date(), {
    message: "Start date must be in the future",
    path: ["startDateTime"],
  });

export class CreateReservationDto extends createZodDto(
  CreateReservationSchema
) {}

export class ReservationResponseDto {
  id: string;
  customerId: string;
  equipmentTypeId: string;
  startDateTime: Date;
  endDateTime: Date;
  quantity: number;
  status: string;
  quotedPrice?: number;
  notes?: string;
  createdAt: Date;
}
