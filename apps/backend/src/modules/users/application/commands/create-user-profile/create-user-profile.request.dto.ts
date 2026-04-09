import { createUserProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateUserProfileRequestDto extends createZodDto(createUserProfileSchema) {}
