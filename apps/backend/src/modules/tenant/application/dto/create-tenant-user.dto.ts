import { registerSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(registerSchema) {}
