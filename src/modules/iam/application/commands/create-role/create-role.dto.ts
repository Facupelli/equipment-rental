import { createZodDto } from "nestjs-zod";
import { Permission } from "src/modules/iam/domain/enums/permissions.enum";
import z from "zod";

const CreateRoleDtoSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	permissions: z.array(z.enum(Permission)).optional(),
});

export class CreateRoleDto extends createZodDto(CreateRoleDtoSchema) {}
