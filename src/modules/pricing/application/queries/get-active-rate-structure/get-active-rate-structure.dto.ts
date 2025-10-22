import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const GetActiveRateStructureSchema = z.object({
	equipmentTypeId: z.uuid(),
	date: z.coerce.date(),
});

export class GetActiveRateStructureDto extends createZodDto(
	GetActiveRateStructureSchema,
) {}
