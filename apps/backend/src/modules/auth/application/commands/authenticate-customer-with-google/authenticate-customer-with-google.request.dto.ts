import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuthenticateCustomerWithGoogleSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
  state: z.string().min(1),
  codeVerifier: z.string().min(43).max(128).optional(),
});

export class AuthenticateCustomerWithGoogleRequestDto extends createZodDto(AuthenticateCustomerWithGoogleSchema) {}
