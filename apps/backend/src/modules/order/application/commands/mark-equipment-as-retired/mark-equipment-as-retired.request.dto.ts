import { getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class MarkEquipmentAsRetiredRequestDto extends createZodDto(getOrderByIdParamSchema) {}
