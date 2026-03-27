import { createZodDto } from 'nestjs-zod';
import { meResponseSchema } from '@repo/schemas';

export class GetUserResponseDto extends createZodDto(meResponseSchema) {}
