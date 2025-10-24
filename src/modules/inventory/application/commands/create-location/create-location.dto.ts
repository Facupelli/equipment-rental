import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateLocationSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

export class CreateLocationDto extends createZodDto(CreateLocationSchema) {}
