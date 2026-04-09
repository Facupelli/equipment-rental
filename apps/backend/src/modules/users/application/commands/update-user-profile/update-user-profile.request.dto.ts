import { updateUserProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserProfileRequestDto extends createZodDto(updateUserProfileSchema) {}
