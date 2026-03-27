import { createOrderSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateOrderRequestDto extends createZodDto(createOrderSchema) {}
