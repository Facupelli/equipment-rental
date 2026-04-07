import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserProfileSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  documentNumber: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  signUrl: z.string().trim().url().optional(),
});

export class UpdateUserProfileRequestDto extends createZodDto(UpdateUserProfileSchema) {}
