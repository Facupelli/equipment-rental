import { GetOrdersScheduleQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetOrdersScheduleRequestDto extends createZodDto(GetOrdersScheduleQuerySchema) {}
