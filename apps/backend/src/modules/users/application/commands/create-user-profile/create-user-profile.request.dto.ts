import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserProfileSchema = z.object({
  fullName: z.string().trim().min(1),
  documentNumber: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  signUrl: z.string().trim().url(),
});

export class CreateUserProfileRequestDto extends createZodDto(CreateUserProfileSchema) {}
