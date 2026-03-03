import { createOrderSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateOrderDto extends createZodDto(createOrderSchema) {}
