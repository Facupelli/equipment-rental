import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserProfileResponseSchema = z.object({
  id: z.uuid(),
});

export class CreateUserProfileResponseDto extends createZodDto(CreateUserProfileResponseSchema) {}
