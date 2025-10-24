import { createZodDto } from "nestjs-zod";
import z from "zod";

export enum StatusUpdateAction {
	MARK_AVAILABLE = "MARK_AVAILABLE",
	MARK_MAINTENANCE = "MARK_MAINTENANCE",
	MARK_LOST = "MARK_LOST",
	RETIRE = "RETIRE",
}

const UpdateEquipmentStatusSchema = z.object({
	action: z.enum(StatusUpdateAction),
	reason: z.string().optional(),
});

const UpdateEquipmentStatusParamsSchema = z.object({
	equipmentItemId: z.string().min(1),
});

export class UpdateEquipmentStatusDto extends createZodDto(
	UpdateEquipmentStatusSchema,
) {}

export class UpdateEquipmentStatusParamsDto extends createZodDto(
	UpdateEquipmentStatusParamsSchema,
) {}
