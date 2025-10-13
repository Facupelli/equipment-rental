import { createZodDto } from "nestjs-zod";
import z from "zod";

const CheckAvailabilitySchema = z
  .object({
    equipmentTypeId: z.uuid("Invalid equipment type ID"),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
    quantity: z.number().int().positive("Quantity must be positive"),
  })
  .refine((data) => data.endDateTime > data.startDateTime, {
    message: "End date must be after start date",
    path: ["endDateTime"],
  });

export class CheckAvailabilityDto extends createZodDto(
  CheckAvailabilitySchema
) {}

export class AvailabilityResponseDto {
  isAvailable: boolean;
  totalInventory: number;
  peakUsage: number;
  requestedQuantity: number;
  remainingCapacity: number;
}
