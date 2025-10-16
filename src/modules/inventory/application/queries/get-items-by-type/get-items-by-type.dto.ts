import { createZodDto } from "nestjs-zod";
import z from "zod";

const GetItemsByType = z.object({
	equipmentTypeId: z.uuid("Invalid equipment type ID"),
});

export class GetItemsByTypeDto extends createZodDto(GetItemsByType) {}
