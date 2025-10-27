import { createZodDto } from "nestjs-zod";
import z from "zod";

const GetUserById = z.object({
	userId: z.uuid("Invalid User ID"),
});

export class GetUserByIdDto extends createZodDto(GetUserById) {}
