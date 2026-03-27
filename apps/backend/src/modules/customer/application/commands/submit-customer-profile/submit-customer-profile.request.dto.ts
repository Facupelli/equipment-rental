import { customerProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class SubmitCustomerProfileRequestDto extends createZodDto(customerProfileSchema) {}
