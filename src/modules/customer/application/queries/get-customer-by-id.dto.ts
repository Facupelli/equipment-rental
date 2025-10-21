import { createZodDto } from "nestjs-zod";
import z from "zod";

const GetCustomerById = z.object({
	customerId: z.uuid("Invalid Customer ID"),
});

export class GetCustomerByIdDto extends createZodDto(GetCustomerById) {}
