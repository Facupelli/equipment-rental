import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserProfileResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  fullName: z.string(),
  documentNumber: z.string(),
  phone: z.string(),
  address: z.string(),
  signUrl: z.string().url(),
});

export class GetUserProfileResponseDto extends createZodDto(UserProfileResponseSchema) {}
