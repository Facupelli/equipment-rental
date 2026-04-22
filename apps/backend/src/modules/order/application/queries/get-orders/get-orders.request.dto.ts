import { createZodDto } from 'nestjs-zod';
import { getOrdersQuerySchema } from '@repo/schemas';

export class GetOrdersRequestDto extends createZodDto(getOrdersQuerySchema) {}
