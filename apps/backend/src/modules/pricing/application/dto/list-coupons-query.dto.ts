import { listCouponsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ListCouponsQueryDto extends createZodDto(listCouponsQuerySchema) {}
