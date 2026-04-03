import { customDomainResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export const CustomDomainResponseSchema = customDomainResponseSchema;

export class CustomDomainResponseDto extends createZodDto(CustomDomainResponseSchema) {}
