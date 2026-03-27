import { createZodDto } from 'nestjs-zod';
import { getOrderByIdParamSchema } from '@repo/schemas';

export class GetOrderByIdRequestDto extends createZodDto(getOrderByIdParamSchema) {}
