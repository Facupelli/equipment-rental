import { createCustomerSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateCustomerDto extends createZodDto(createCustomerSchema) {}
