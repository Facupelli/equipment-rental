import { createZodDto } from "nestjs-zod";
import z from "zod";

const UpdateEquipmentTypeSchema = z.object({
	description: z.string().optional(),
	bufferDays: z.coerce.number().optional(),
});

export class UpdateEquipmentTypeDto extends createZodDto(
	UpdateEquipmentTypeSchema,
) {}

const UpdateEquipmentTypeParamsSchema = z.object({
	equipmentTypeId: z.string().min(1),
});

export class UpdateEquipmentTypeParamsDto extends createZodDto(
	UpdateEquipmentTypeParamsSchema,
) {}
