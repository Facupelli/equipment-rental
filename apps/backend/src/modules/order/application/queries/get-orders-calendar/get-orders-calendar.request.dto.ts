import { GetOrdersCalendarQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetOrdersCalendarRequestDto extends createZodDto(GetOrdersCalendarQuerySchema) {}
