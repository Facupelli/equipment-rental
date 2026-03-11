import { getCustomersQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetCustomersQueryDto extends createZodDto(getCustomersQuerySchema) {}
