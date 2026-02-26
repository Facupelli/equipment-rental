import { createZodDto } from 'nestjs-zod';
import { meResponseSchema } from '@repo/schemas';

export class MeResponseDto extends createZodDto(meResponseSchema) {}
