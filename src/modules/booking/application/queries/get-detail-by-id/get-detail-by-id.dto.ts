import { createZodDto } from "nestjs-zod";
import z from "zod";

const GetDetailByIdSchema = z.object({
	orderId: z.uuid("Invalid Order ID"),
});

export class GetDetailByIdDto extends createZodDto(GetDetailByIdSchema) {}
