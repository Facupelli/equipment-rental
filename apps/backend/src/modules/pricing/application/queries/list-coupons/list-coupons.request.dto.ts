import { listCouponsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ListCouponsRequestDto extends createZodDto(listCouponsQuerySchema) {}
