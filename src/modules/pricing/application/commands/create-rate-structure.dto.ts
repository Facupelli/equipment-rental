import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateRateStructureSchema = z.object({
	equipmentTypeId: z.uuid(),
	hourlyRate: z.number().positive(),
	dailyRate: z.number().positive(),
	minimumCharge: z.number().nonnegative().default(0),
	taxPercentage: z.number().min(0).max(1),
	effectiveFrom: z.coerce.date(),
	effectiveTo: z.coerce.date().optional(),
});

export class CreateRateStructureDto extends createZodDto(
	CreateRateStructureSchema,
) {}
