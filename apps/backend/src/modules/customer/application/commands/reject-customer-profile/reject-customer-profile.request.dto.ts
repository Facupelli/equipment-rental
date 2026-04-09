import { rejectCustomerProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class RejectCustomerProfileRequestDto extends createZodDto(rejectCustomerProfileSchema) {}
