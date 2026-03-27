import { getCustomersQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetCustomersRequestDto extends createZodDto(getCustomersQuerySchema) {}
