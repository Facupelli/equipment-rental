import { createOwnerSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateOwnerDto extends createZodDto(createOwnerSchema) {}
