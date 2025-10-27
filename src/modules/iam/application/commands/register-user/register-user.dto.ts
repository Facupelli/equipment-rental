import { createZodDto } from "nestjs-zod";
import z from "zod";

const RegisterUserSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(255, "Name must be less than 255 characters")
		.trim(),
	email: z.email("Invalid email format").toLowerCase().trim(),
	phone: z
		.string()
		.min(10, "Phone must be at least 10 digits")
		.max(20, "Phone must be less than 20 characters")
		.regex(
			/^[\d\s\-+()]+$/,
			"Phone can only contain digits, spaces, and symbols: + - ( )",
		)
		.trim(),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
