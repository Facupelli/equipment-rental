import { createZodDto } from "nestjs-zod";
import z from "zod";

const AssignRoleDtoSchema = z.object({
	roleId: z.uuid(),
});

export class AssignRoleDto extends createZodDto(AssignRoleDtoSchema) {}
