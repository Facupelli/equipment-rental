import { createZodDto } from "nestjs-zod";
import z from "zod";

const RegisterEquipmentSchema = z.object({
	equipmentTypeId: z.uuid("Invalid Equipment Type ID").min(1),
	currentLocationId: z.uuid("Invalid Location ID").min(1),
	serialNumber: z.string().min(1),
});

export class RegisterEquipmentDto extends createZodDto(
	RegisterEquipmentSchema,
) {}

export class EquipmentItemResponseDto {
	id: string;
	equipmentTypeId: string;
	serialNumber: string;
	status: string;
}
