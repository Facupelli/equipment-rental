import { CustomerCreateSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateCustomerDto extends createZodDto(CustomerCreateSchema) {}
