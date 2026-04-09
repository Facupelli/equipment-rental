import { approveCustomerProfileSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ApproveCustomerProfileRequestDto extends createZodDto(approveCustomerProfileSchema) {}
