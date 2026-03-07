import { GetOrdersScheduleQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetOrdersScheduleQueryDto extends createZodDto(GetOrdersScheduleQuerySchema) {}
