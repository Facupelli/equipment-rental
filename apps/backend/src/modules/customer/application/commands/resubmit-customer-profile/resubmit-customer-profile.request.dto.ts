import { customerProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ResubmitCustomerProfileRequestDto extends createZodDto(customerProfileSchema) {}
