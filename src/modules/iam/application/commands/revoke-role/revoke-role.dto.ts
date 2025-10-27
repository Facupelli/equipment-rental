import { createZodDto } from "nestjs-zod";
import z from "zod";

const RevokeRoleDtoSchema = z.object({
	userId: z.uuid(),
	roleId: z.uuid(),
});

export class RevokeRoleDto extends createZodDto(RevokeRoleDtoSchema) {}
