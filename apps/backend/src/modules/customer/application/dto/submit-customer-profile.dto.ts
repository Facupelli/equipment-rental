import { customerProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class SubmitCustomerProfileDto extends createZodDto(customerProfileSchema) {}
