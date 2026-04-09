import { userProfileResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetUserProfileResponseDto extends createZodDto(userProfileResponseSchema) {}
