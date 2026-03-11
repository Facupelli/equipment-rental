import { registerCustomerSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class RegisterCustomerDto extends createZodDto(registerCustomerSchema) {}
